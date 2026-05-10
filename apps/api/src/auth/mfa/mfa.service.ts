import { Injectable } from "@nestjs/common"
import { generateSecret, generateURI, verify } from "otplib"
import { ApiException } from "../../common/errors/api-exception"
import { PrismaService } from "../../common/prisma/prisma.service"
import { AuthEventosService } from "../auth-eventos.service"
import { MfaChallengeService } from "./mfa-challenge.service"
import { MfaCryptoService } from "./mfa-crypto.service"

interface DatosCliente {
  readonly ip?: string | null
  readonly userAgent?: string | null
}

interface SetupChallenge {
  readonly challengeId: string
  readonly secret: string
  readonly otpauthUri: string
}

const ISSUER = "NexoTT Learn"

/**
 * MfaService — Orquesta el flujo MFA TOTP.
 *
 * Modos:
 * - SETUP: primer login con MFA habilitado, mfaConfirmadoEn=null. Se genera
 *   secret nuevo cada vez (regenera si el usuario abandona y vuelve), se
 *   cifra y se guarda. El secret se devuelve UNA vez al cliente para QR.
 * - VERIFY: logins posteriores. Solo se verifica el codigo contra el secret
 *   cifrado en BD. Nunca se devuelve el secret al cliente.
 *
 * Estandar: TOTP RFC 6238 (compatible Google Authenticator, Authy, 1Password).
 * Window de verificacion ±1 step (90s) para tolerancia de drift.
 */
@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: MfaCryptoService,
    private readonly challenges: MfaChallengeService,
    private readonly eventos: AuthEventosService,
  ) {}

  iniciarChallenge(usuarioId: string): string {
    return this.challenges.crear(usuarioId)
  }

  /**
   * Inicia el setup. Genera un secret nuevo, lo cifra y lo guarda. Si el usuario
   * abandona y vuelve, sobrescribe (regenera). Devuelve secret + URI para QR.
   *
   * SECURITY: este es el unico metodo donde el secret cruza la red al cliente.
   * Solo se llama desde validarCredenciales cuando mfaConfirmadoEn=null.
   */
  async iniciarSetup(usuarioId: string, cliente: DatosCliente = {}): Promise<SetupChallenge> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true, bloqueado: true, mfaActivado: true },
    })
    if (!usuario || usuario.bloqueado || !usuario.mfaActivado) {
      throw new ApiException({
        code: "MFA_INVALID",
        message: "Configuracion MFA invalida",
        status: 401,
      })
    }

    const secret = generateSecret()
    const cifrado = this.crypto.encrypt(secret)

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        mfaSecret: cifrado,
        mfaConfirmadoEn: null,
      },
    })

    const challengeId = this.challenges.crear(usuarioId)
    const otpauthUri = generateURI({
      issuer: ISSUER,
      label: usuario.email,
      secret,
    })

    await this.eventos.registrar({
      tipo: "MFA_SETUP_INICIADO",
      usuarioId,
      email: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    })

    return { challengeId, secret, otpauthUri }
  }

  /**
   * Verifica el codigo TOTP en flujo de login normal (mfaConfirmadoEn != null).
   */
  async verificarChallenge(
    challengeId: string,
    code: string,
    cliente: DatosCliente = {},
  ): Promise<string> {
    const usuario = await this.validarCodigo(challengeId, code, "verify", cliente)
    await this.eventos.registrar({
      tipo: "MFA_VERIFICADO",
      usuarioId: usuario.id,
      email: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    })
    return usuario.id
  }

  /**
   * Confirma el setup: valida el codigo y marca mfaConfirmadoEn=now.
   * Tras esto, los logins posteriores van por el flujo verify.
   */
  async confirmarSetup(
    challengeId: string,
    code: string,
    cliente: DatosCliente = {},
  ): Promise<string> {
    const usuario = await this.validarCodigo(challengeId, code, "setup", cliente)
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { mfaConfirmadoEn: new Date() },
    })
    await this.eventos.registrar({
      tipo: "MFA_ACTIVADO",
      usuarioId: usuario.id,
      email: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    })
    return usuario.id
  }

  /**
   * Resuelve el challenge, descifra el secret y valida el codigo TOTP.
   * Devuelve el usuario al caller para que ejecute su efecto propio
   * (registrar evento OK, marcar confirmacion, etc).
   *
   * Encapsula tambien el manejo de errores: registra MFA_FALLIDO y lanza
   * con el status correcto segun el caso (410 cuando ya no quedan intentos
   * o el challenge expiro, 401 cuando el codigo es invalido pero quedan).
   */
  private async validarCodigo(
    challengeId: string,
    code: string,
    contexto: "setup" | "verify",
    cliente: DatosCliente,
  ): Promise<{ id: string; email: string }> {
    const challenge = this.challenges.obtener(challengeId)
    if (!challenge) {
      throw new ApiException({
        code: "MFA_EXPIRED",
        message:
          contexto === "setup"
            ? "La configuracion expiro. Vuelve a iniciar sesion."
            : "El challenge expiro o es invalido",
        status: 410,
      })
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: challenge.usuarioId },
      select: { id: true, email: true, mfaSecret: true, mfaActivado: true, bloqueado: true },
    })

    const secretCifrado =
      usuario && !usuario.bloqueado && usuario.mfaActivado ? usuario.mfaSecret : null
    if (!(secretCifrado && usuario)) {
      this.challenges.invalidar(challengeId)
      throw new ApiException({
        code: "MFA_INVALID",
        message: "Configuracion MFA invalida",
        status: 401,
      })
    }

    const secretPlano = this.crypto.decrypt(secretCifrado)
    const resultado = await verify({ secret: secretPlano, token: code })

    if (!resultado.valid) {
      const quedanIntentos = this.challenges.registrarIntentoFallido(challengeId)
      await this.eventos.registrar({
        tipo: "MFA_FALLIDO",
        usuarioId: usuario.id,
        email: usuario.email,
        ip: cliente.ip,
        userAgent: cliente.userAgent,
        metadata: { contexto, quedanIntentos },
      })
      throw codigoInvalidoException(contexto, quedanIntentos)
    }

    this.challenges.invalidar(challengeId)
    return { id: usuario.id, email: usuario.email }
  }
}

function codigoInvalidoException(
  contexto: "setup" | "verify",
  quedanIntentos: boolean,
): ApiException {
  if (!quedanIntentos) {
    return new ApiException({
      code: "MFA_EXPIRED",
      message: "Demasiados intentos. Inicia sesion de nuevo.",
      status: 410,
    })
  }
  return new ApiException({
    code: "MFA_INVALID",
    message:
      contexto === "setup" ? "Codigo invalido. Verifica que escaneaste el QR." : "Codigo invalido",
    status: 401,
  })
}
