import { Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { AVISO_VIGENTE_VERSION } from "@nexott-learn/shared-types"
import { AccionAuditoria, EstadoEmpleado } from "@prisma/client"
import { generateSecret, generateURI, verifySync } from "otplib"
import { toDataURL } from "qrcode"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../../common/audit/audit-log.types"
import { CifradoService } from "../../common/crypto/cifrado.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { PerfilSesion } from "../auth.types"
import { MfaCrearChallengeResultado, MfaSetupResponse, MfaVerifyResultado } from "./mfa.types"

const ISSUER_TOTP = "NexoTT Learn"
const DURACION_CHALLENGE_MS = 5 * 60 * 1000
const MAX_INTENTOS_CHALLENGE = 5
// Drift TOTP: ±1 step (±30s, 60s margen total). D-MFA-3 / RFC 6238.
const TOTP_EPOCH_TOLERANCE_SEGUNDOS = 30

/**
 * MfaService — flujo TOTP completo (D-MFA-2..6).
 *
 * Reglas duras:
 *   - El secret SIEMPRE se persiste cifrado con `CifradoService` (AES-256-GCM).
 *   - NO se logea jamas el secret, el codigo TOTP, el QR, el otpauth URL ni el
 *     payload cifrado. Solo metadatos (usuarioId, accion, exito, requestId).
 *   - El verify usa `epochTolerance = 30s` (±1 step) — D-MFA-3.
 *   - El identificador del usuario en `verify` viene del `mfaChallengeId`, NO
 *     del body ni de la sesion (porque verify es la transicion del primer al
 *     segundo factor: aun no hay sesion completa).
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cifrado: CifradoService,
    private readonly auditLog: AuditLogService,
  ) {}

  async setup(usuarioId: string, contexto: ContextoHttpAuditoria = {}): Promise<MfaSetupResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, colaborador: { select: { email: true } } },
    })
    if (!usuario) {
      throw new NotFoundException({
        code: apiErrorCodes.noEncontrado,
        message: "Usuario no encontrado.",
      })
    }

    const secret = generateSecret()
    const cifrado = this.cifrado.encriptar(secret)
    const otpauth = generateURI({
      issuer: ISSUER_TOTP,
      label: usuario.colaborador.email,
      secret,
    })
    const qrCodeDataUrl = await toDataURL(otpauth)

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaSecret: cifrado, mfaHabilitado: false },
    })
    this.logger.log(`MFA setup iniciado para ${usuarioId}`)
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.MFA_SETUP_INICIADO,
      exito: true,
      ...contexto,
    })

    return { qrCodeDataUrl, secret }
  }

  async enable(
    usuarioId: string,
    codigo: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, mfaSecret: true },
    })
    if (!usuario?.mfaSecret) {
      throw new UnauthorizedException({
        code: apiErrorCodes.codigoMfaInvalido,
        message: "El codigo MFA es invalido.",
      })
    }
    const secret = this.cifrado.desencriptar(usuario.mfaSecret)
    if (!this.verificarCodigo(codigo, secret)) {
      this.logger.warn(`MFA enable: codigo invalido para ${usuarioId}`)
      await this.auditLog.record({
        usuarioId,
        accion: AccionAuditoria.MFA_VERIFY_FAIL,
        exito: false,
        ...contexto,
      })
      throw new UnauthorizedException({
        code: apiErrorCodes.codigoMfaInvalido,
        message: "El codigo MFA es invalido.",
      })
    }
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaHabilitado: true, requiereSetupMfa: false },
    })
    this.logger.log(`MFA habilitado para ${usuarioId}`)
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.MFA_ENABLED,
      exito: true,
      ...contexto,
    })
  }

  async crearChallenge(
    usuarioId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<MfaCrearChallengeResultado> {
    const expiraEn = new Date(Date.now() + DURACION_CHALLENGE_MS)
    const challenge = await this.prisma.mfaChallenge.create({
      data: { usuarioId, expiraEn },
      select: { id: true },
    })
    this.logger.log(`MFA challenge ${challenge.id} creado para ${usuarioId}`)
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.LOGIN_PARCIAL_OK,
      exito: true,
      recursoTipo: "mfa_challenge",
      recursoId: challenge.id,
      ...contexto,
    })
    return { mfaChallengeId: challenge.id }
  }

  async verify(
    challengeId: string,
    codigo: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<MfaVerifyResultado> {
    const challenge = await this.prisma.mfaChallenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        usuarioId: true,
        expiraEn: true,
        usado: true,
        intentos: true,
      },
    })

    const errorExpirado = (): UnauthorizedException =>
      new UnauthorizedException({
        code: apiErrorCodes.mfaChallengeExpirado,
        message: "El intento de verificacion ha expirado o no es valido.",
      })
    const errorInvalido = (): UnauthorizedException =>
      new UnauthorizedException({
        code: apiErrorCodes.codigoMfaInvalido,
        message: "El codigo MFA es invalido.",
      })

    if (!challenge || challenge.usado || challenge.expiraEn.getTime() <= Date.now()) {
      await this.auditLog.record({
        usuarioId: challenge?.usuarioId ?? null,
        accion: AccionAuditoria.MFA_VERIFY_FAIL,
        exito: false,
        recursoTipo: "mfa_challenge",
        recursoId: challengeId,
        ...contexto,
      })
      throw errorExpirado()
    }

    if (challenge.intentos >= MAX_INTENTOS_CHALLENGE) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { usado: true },
      })
      await this.auditLog.record({
        usuarioId: challenge.usuarioId,
        accion: AccionAuditoria.MFA_VERIFY_FAIL,
        exito: false,
        recursoTipo: "mfa_challenge",
        recursoId: challenge.id,
        ...contexto,
      })
      throw errorExpirado()
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: challenge.usuarioId },
      select: {
        id: true,
        mfaSecret: true,
        mfaHabilitado: true,
        rol: true,
        requiereCambioPassword: true,
        colaborador: {
          select: { id: true, email: true, nombre: true, estadoEmpleado: true },
        },
      },
    })

    const auditarFalloUsuarioInvalido = async (): Promise<void> => {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { intentos: { increment: 1 } },
      })
      await this.auditLog.record({
        usuarioId: challenge.usuarioId,
        accion: AccionAuditoria.MFA_VERIFY_FAIL,
        exito: false,
        recursoTipo: "mfa_challenge",
        recursoId: challenge.id,
        ...contexto,
      })
    }

    if (usuario === null || usuario.mfaSecret === null) {
      await auditarFalloUsuarioInvalido()
      throw errorInvalido()
    }
    if (usuario.colaborador.estadoEmpleado === EstadoEmpleado.EX_EMPLEADO) {
      await auditarFalloUsuarioInvalido()
      throw errorInvalido()
    }
    if (usuario.mfaHabilitado === false) {
      await auditarFalloUsuarioInvalido()
      throw errorInvalido()
    }

    const secret = this.cifrado.desencriptar(usuario.mfaSecret)
    if (!this.verificarCodigo(codigo, secret)) {
      const tras = await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { intentos: { increment: 1 } },
        select: { intentos: true },
      })
      this.logger.warn(
        `MFA verify: codigo invalido (challenge=${challenge.id} intentos=${tras.intentos})`,
      )
      await this.auditLog.record({
        usuarioId: challenge.usuarioId,
        accion: AccionAuditoria.MFA_VERIFY_FAIL,
        exito: false,
        recursoTipo: "mfa_challenge",
        recursoId: challenge.id,
        ...contexto,
      })
      throw errorInvalido()
    }

    await this.prisma.$transaction([
      this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { usado: true },
      }),
      this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, ultimoLogin: new Date() },
      }),
    ])

    const aceptacion = await this.prisma.aceptacionAvisoPrivacidad.findFirst({
      where: { usuarioId: usuario.id, versionAviso: AVISO_VIGENTE_VERSION },
      select: { id: true },
    })

    const perfil: PerfilSesion = {
      usuarioId: usuario.id,
      colaboradorId: usuario.colaborador.id,
      rol: usuario.rol,
      nombre: usuario.colaborador.nombre,
      email: usuario.colaborador.email,
      requiereCambioPassword: usuario.requiereCambioPassword,
      requiereAceptarAvisoPrivacidad: aceptacion === null,
      mfaHabilitado: true,
    }

    this.logger.log(`MFA verify OK para ${usuario.id}`)
    await this.auditLog.record({
      usuarioId: usuario.id,
      accion: AccionAuditoria.MFA_VERIFY_OK,
      exito: true,
      recursoTipo: "mfa_challenge",
      recursoId: challenge.id,
      ...contexto,
    })

    return { usuarioId: usuario.id, perfil }
  }

  async disablePropio(
    usuarioId: string,
    codigo: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, mfaSecret: true, mfaHabilitado: true },
    })
    const errorMfaInactivo = new UnauthorizedException({
      code: apiErrorCodes.codigoMfaInvalido,
      message: "MFA no esta habilitado para esta cuenta.",
    })
    if (usuario === null || usuario.mfaHabilitado === false) {
      throw errorMfaInactivo
    }
    if (usuario.mfaSecret === null) {
      throw errorMfaInactivo
    }
    const secret = this.cifrado.desencriptar(usuario.mfaSecret)
    if (!this.verificarCodigo(codigo, secret)) {
      this.logger.warn(`MFA disable propio: codigo invalido para ${usuarioId}`)
      await this.auditLog.record({
        usuarioId,
        accion: AccionAuditoria.MFA_VERIFY_FAIL,
        exito: false,
        ...contexto,
      })
      throw new UnauthorizedException({
        code: apiErrorCodes.codigoMfaInvalido,
        message: "El codigo MFA es invalido.",
      })
    }
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaHabilitado: false, mfaSecret: null, requiereSetupMfa: false },
    })
    this.logger.log(`MFA deshabilitado por el propio usuario ${usuarioId}`)
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.MFA_DISABLED,
      exito: true,
      recursoTipo: "usuario",
      recursoId: usuarioId,
      ...contexto,
    })
  }

  async disableAdmin(
    adminUsuarioId: string,
    usuarioObjetivoId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    const objetivo = await this.prisma.usuario.findUnique({
      where: { id: usuarioObjetivoId },
      select: { id: true },
    })
    if (!objetivo) {
      throw new NotFoundException({
        code: apiErrorCodes.noEncontrado,
        message: "Usuario objetivo no encontrado.",
      })
    }
    await this.prisma.usuario.update({
      where: { id: usuarioObjetivoId },
      data: { mfaHabilitado: false, mfaSecret: null, requiereSetupMfa: false },
    })
    this.logger.log(`MFA deshabilitado por admin ${adminUsuarioId} sobre ${usuarioObjetivoId}`)
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.MFA_DISABLED,
      exito: true,
      recursoTipo: "usuario",
      recursoId: usuarioObjetivoId,
      ...contexto,
    })
  }

  /**
   * Verificacion TOTP con drift ±1 step (RFC 6238). El plugin sync requiere
   * crypto sincrono — otplib v13 lo trae por defecto.
   */
  private verificarCodigo(codigo: string, secret: string): boolean {
    try {
      const result = verifySync({
        secret,
        token: codigo,
        epochTolerance: TOTP_EPOCH_TOLERANCE_SEGUNDOS,
      })
      return result.valid
    } catch {
      // Si el secret es invalido o el token tiene caracteres no numericos.
      return false
    }
  }
}
