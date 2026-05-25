import {
  ForbiddenException,
  Injectable,
  Logger,
  NotImplementedException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { AVISO_VIGENTE_VERSION } from "@nexott-learn/shared-types"
import {
  AccionAuditoria,
  EstadoEmpleado,
  ModoEntregaPassword,
  Prisma,
  RolUsuario,
} from "@prisma/client"
import bcrypt from "bcrypt"
import { generarPasswordSegura } from "../colaboradores/password-generator"
import { AuditLogService } from "../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../common/audit/audit-log.types"
import { FACTOR_BCRYPT } from "../common/auth/bcrypt.constants"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import {
  PerfilSesion,
  ResultadoRegenerarPassword,
  SELECT_USUARIO_AUTH,
  UsuarioAuthRow,
} from "./auth.types"
import { MfaService } from "./mfa/mfa.service"

const MAX_INTENTOS_FALLIDOS = 5
const DIAS_CADUCIDAD_PASSWORD_INICIAL = 7
const MS_POR_DIA = 24 * 60 * 60 * 1000
const REGEX_FORTALEZA_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/

interface ResultadoLoginCompleto {
  readonly tipo: "completo"
  readonly usuario: UsuarioAuthRow
  readonly perfil: PerfilSesion
}

interface ResultadoLoginMfaPendiente {
  readonly tipo: "mfaPendiente"
  readonly mfaChallengeId: string
}

export type ResultadoLogin = ResultadoLoginCompleto | ResultadoLoginMfaPendiente

/**
 * AuthService — credenciales, password, sesiones server-side.
 *
 * Reglas duras:
 *   - bcrypt factor 12, no parametrizable.
 *   - mensaje generico en login (no revelar si el email existe).
 *   - identidad SIEMPRE de la sesion / del id verificado, jamas del body.
 *   - 0 logs de email/password/hash. Para correlar, `usuarioId` (uuid).
 *   - audit log estructural via `AuditLogService.record()` fire-and-forget.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly mfaService: MfaService,
  ) {}

  async validarCredenciales(
    email: string,
    password: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ResultadoLogin> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { colaborador: { email } },
      select: SELECT_USUARIO_AUTH,
    })

    const credencialesInvalidas = (): UnauthorizedException =>
      new UnauthorizedException({
        code: apiErrorCodes.credencialesInvalidas,
        message: "Credenciales invalidas.",
      })

    if (!usuario) {
      await this.auditLog.record({
        usuarioId: null,
        accion: AccionAuditoria.LOGIN_FAIL,
        exito: false,
        ...contexto,
      })
      throw credencialesInvalidas()
    }
    if (usuario.colaborador.estadoEmpleado === EstadoEmpleado.EX_EMPLEADO) {
      this.logger.warn(`Login bloqueado: usuario ${usuario.id} es EX_EMPLEADO`)
      await this.auditLog.record({
        usuarioId: usuario.id,
        accion: AccionAuditoria.LOGIN_FAIL,
        exito: false,
        ...contexto,
      })
      throw new ForbiddenException({
        code: apiErrorCodes.usuarioExEmpleado,
        message: "La cuenta esta deshabilitada.",
      })
    }
    if (usuario.bloqueado) {
      this.logger.warn(`Login bloqueado: usuario ${usuario.id} esta bloqueado`)
      await this.auditLog.record({
        usuarioId: usuario.id,
        accion: AccionAuditoria.LOGIN_FAIL,
        exito: false,
        ...contexto,
      })
      throw new ForbiddenException({
        code: apiErrorCodes.usuarioBloqueado,
        message: "La cuenta esta bloqueada. Solicite desbloqueo a un administrador.",
      })
    }
    if (
      usuario.requiereCambioPassword &&
      usuario.passwordInicialCaduca &&
      usuario.passwordInicialCaduca.getTime() < Date.now()
    ) {
      this.logger.warn(`Login bloqueado: password inicial caducada para ${usuario.id}`)
      await this.auditLog.record({
        usuarioId: usuario.id,
        accion: AccionAuditoria.LOGIN_FAIL,
        exito: false,
        ...contexto,
      })
      throw new ForbiddenException({
        code: apiErrorCodes.passwordInicialCaducada,
        message: "La contrasena inicial ha caducado. Solicite una nueva al administrador.",
      })
    }

    const valido = await bcrypt.compare(password, usuario.passwordHash)
    if (!valido) {
      await this.registrarIntentoFallido(usuario.id, usuario.intentosFallidos)
      await this.auditLog.record({
        usuarioId: usuario.id,
        accion: AccionAuditoria.LOGIN_FAIL,
        exito: false,
        ...contexto,
      })
      throw credencialesInvalidas()
    }

    if (usuario.mfaHabilitado) {
      // Resetea intentos fallidos al validar la primera factor; el ultimoLogin
      // se actualiza recien al completar verify (sino se ensucia el contador
      // si el usuario abandona el flujo).
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0 },
      })
      const { mfaChallengeId } = await this.mfaService.crearChallenge(usuario.id, contexto)
      return { tipo: "mfaPendiente", mfaChallengeId }
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, ultimoLogin: new Date() },
    })
    this.logger.log(`Login exitoso para ${usuario.id}`)
    await this.auditLog.record({
      usuarioId: usuario.id,
      accion: AccionAuditoria.LOGIN_OK,
      exito: true,
      ...contexto,
    })

    const perfil = await this.construirPerfil(usuario)
    return { tipo: "completo", usuario, perfil }
  }

  async cambiarPassword(
    usuarioId: string,
    sidActual: string,
    passwordActual: string,
    passwordNuevo: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    if (!REGEX_FORTALEZA_PASSWORD.test(passwordNuevo)) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.passwordDebil,
        message: "La nueva contrasena no cumple los requisitos de fortaleza.",
      })
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, passwordHash: true },
    })
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }

    const actualValido = await bcrypt.compare(passwordActual, usuario.passwordHash)
    if (!actualValido) {
      this.logger.warn(`Cambio de password rechazado: actual invalido (${usuarioId})`)
      throw new UnauthorizedException({
        code: apiErrorCodes.passwordActualInvalido,
        message: "La contrasena actual es invalida.",
      })
    }

    const reusoMismo = await bcrypt.compare(passwordNuevo, usuario.passwordHash)
    if (reusoMismo) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.passwordRepetido,
        message: "La nueva contrasena no puede ser igual a la actual.",
      })
    }

    const ultimoHistorico = await this.prisma.historicoPassword.findFirst({
      where: { usuarioId },
      orderBy: { fechaCambio: "desc" },
      select: { hash: true },
    })
    if (ultimoHistorico) {
      const reusoHistorico = await bcrypt.compare(passwordNuevo, ultimoHistorico.hash)
      if (reusoHistorico) {
        throw new UnprocessableEntityException({
          code: apiErrorCodes.passwordRepetido,
          message: "La nueva contrasena no puede repetir la ultima utilizada.",
        })
      }
    }

    const nuevoHash = await bcrypt.hash(passwordNuevo, FACTOR_BCRYPT)

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          passwordHash: nuevoHash,
          requiereCambioPassword: false,
          passwordInicialCaduca: null,
          intentosFallidos: 0,
        },
      }),
      this.prisma.historicoPassword.create({
        data: { usuarioId, hash: nuevoHash },
      }),
    ])

    await this.invalidarOtrasSesiones(usuarioId, sidActual)
    this.logger.log(`Password cambiada para ${usuarioId}`)
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.PASSWORD_CHANGED,
      exito: true,
      ...contexto,
    })
  }

  async aceptarAvisoPrivacidad(
    usuarioId: string,
    versionAviso: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    await this.prisma.aceptacionAvisoPrivacidad.create({
      data: { usuarioId, versionAviso },
    })
    this.logger.log(`Aviso ${versionAviso} aceptado por ${usuarioId}`)
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.AVISO_ACEPTADO,
      exito: true,
      ...contexto,
    })
  }

  async obtenerPerfil(usuarioId: string): Promise<PerfilSesion> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: SELECT_USUARIO_AUTH,
    })
    if (!usuario) {
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Sesion invalida.",
      })
    }
    return this.construirPerfil(usuario)
  }

  async regenerarPasswordInicial(
    adminUsuarioId: string,
    usuarioObjetivoId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<ResultadoRegenerarPassword> {
    const config = await this.prisma.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { modoEntregaPassword: true },
    })
    const modo = config?.modoEntregaPassword ?? ModoEntregaPassword.MANUAL
    if (modo !== ModoEntregaPassword.MANUAL) {
      throw new NotImplementedException({
        code: apiErrorCodes.modoAutomaticoNoDisponible,
        message: "El envio automatico por correo se implementa en la fase P10.",
      })
    }

    const passwordTemporal = generarPasswordSegura()
    const hash = await bcrypt.hash(passwordTemporal, FACTOR_BCRYPT)
    const caducaEn = new Date(Date.now() + DIAS_CADUCIDAD_PASSWORD_INICIAL * MS_POR_DIA)

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: usuarioObjetivoId },
        data: {
          passwordHash: hash,
          requiereCambioPassword: true,
          passwordInicialCaduca: caducaEn,
          intentosFallidos: 0,
          bloqueado: false,
        },
      }),
      this.prisma.historicoPassword.create({
        data: { usuarioId: usuarioObjetivoId, hash },
      }),
    ])

    await this.invalidarTodasLasSesiones(usuarioObjetivoId)
    this.logger.log(`Password inicial regenerada para ${usuarioObjetivoId}`)
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.PASSWORD_REGENERATED,
      exito: true,
      recursoTipo: "usuario",
      recursoId: usuarioObjetivoId,
      ...contexto,
    })
    return { modoEntrega: "MANUAL", passwordTemporal, caducaEn }
  }

  async desbloquear(
    adminUsuarioId: string,
    usuarioObjetivoId: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuarioObjetivoId },
      data: { bloqueado: false, intentosFallidos: 0 },
    })
    this.logger.log(`Usuario desbloqueado ${usuarioObjetivoId}`)
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.USUARIO_DESBLOQUEADO,
      exito: true,
      recursoTipo: "usuario",
      recursoId: usuarioObjetivoId,
      ...contexto,
    })
  }

  async eliminarSesion(
    adminUsuarioId: string,
    sid: string,
    contexto: ContextoHttpAuditoria = {},
  ): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM sesiones WHERE sid = ${sid}`
    await this.auditLog.record({
      usuarioId: adminUsuarioId,
      accion: AccionAuditoria.SESION_ELIMINADA,
      exito: true,
      recursoTipo: "sesion",
      recursoId: sid,
      ...contexto,
    })
  }

  async registrarLogout(usuarioId: string, contexto: ContextoHttpAuditoria = {}): Promise<void> {
    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.LOGOUT,
      exito: true,
      ...contexto,
    })
  }

  async invalidarOtrasSesiones(usuarioId: string, sidActual: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE sid <> ${sidActual}
        AND (sess::jsonb->>'usuarioId') = ${usuarioId}
    `
  }

  async invalidarTodasLasSesiones(usuarioId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') = ${usuarioId}
    `
  }

  hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, FACTOR_BCRYPT)
  }

  fechaCaducidadPasswordInicial(): Date {
    return new Date(Date.now() + DIAS_CADUCIDAD_PASSWORD_INICIAL * MS_POR_DIA)
  }

  rolValidoParaSesion(rol: RolUsuario): boolean {
    return rol === RolUsuario.ADMIN || rol === RolUsuario.PARTICIPANTE
  }

  private async registrarIntentoFallido(
    usuarioId: string,
    intentosActuales: number,
  ): Promise<void> {
    const nuevoIntento = intentosActuales + 1
    const debeBloquear = nuevoIntento >= MAX_INTENTOS_FALLIDOS
    const data: Prisma.UsuarioUpdateInput = {
      intentosFallidos: nuevoIntento,
    }
    if (debeBloquear) {
      data.bloqueado = true
    }
    await this.prisma.usuario.update({ where: { id: usuarioId }, data })
    if (debeBloquear) {
      this.logger.warn(`Usuario bloqueado por intentos fallidos: ${usuarioId}`)
    } else {
      this.logger.warn(`Intento fallido ${nuevoIntento} para ${usuarioId}`)
    }
  }

  private async construirPerfil(usuario: UsuarioAuthRow): Promise<PerfilSesion> {
    const aceptacion = await this.prisma.aceptacionAvisoPrivacidad.findFirst({
      where: { usuarioId: usuario.id, versionAviso: AVISO_VIGENTE_VERSION },
      select: { id: true },
    })
    return {
      usuarioId: usuario.id,
      colaboradorId: usuario.colaborador.id,
      rol: usuario.rol,
      nombre: usuario.colaborador.nombre,
      email: usuario.colaborador.email,
      requiereCambioPassword: usuario.requiereCambioPassword,
      requiereAceptarAvisoPrivacidad: aceptacion === null,
      mfaHabilitado: usuario.mfaHabilitado,
    }
  }
}
