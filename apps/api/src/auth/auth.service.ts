import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import bcrypt from "bcrypt"
import { ApiException } from "../common/errors/api-exception"
import { PrismaService } from "../common/prisma/prisma.service"
import { AuthEventosService } from "./auth-eventos.service"
import type { UsuarioSesion } from "./tipos"

interface DatosCliente {
  readonly ip?: string | null
  readonly userAgent?: string | null
}

interface CredencialesValidasSinMfa {
  readonly tipo: "sesion"
  readonly usuario: UsuarioSesion
}

interface CredencialesValidasConMfaVerify {
  readonly tipo: "mfa-verify-pendiente"
  readonly usuarioId: string
  readonly emailEnmascarado: string
}

interface CredencialesValidasConMfaSetup {
  readonly tipo: "mfa-setup-pendiente"
  readonly usuarioId: string
  readonly emailEnmascarado: string
}

export type ResultadoCredenciales =
  | CredencialesValidasSinMfa
  | CredencialesValidasConMfaVerify
  | CredencialesValidasConMfaSetup

const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 15
const BCRYPT_ROUNDS = 12

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: AuthEventosService,
  ) {}

  async validarCredenciales(
    email: string,
    password: string,
    cliente: DatosCliente = {},
  ): Promise<ResultadoCredenciales> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (!usuario || usuario.bloqueado) {
      await this.eventos.registrar({
        tipo: "LOGIN_FALLIDO",
        email,
        ip: cliente.ip,
        userAgent: cliente.userAgent,
        metadata: { motivo: "usuario_inexistente_o_bloqueado" },
      })
      throw ApiException.invalidCredentials()
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      await this.eventos.registrar({
        tipo: "LOGIN_BLOQUEADO",
        usuarioId: usuario.id,
        email: usuario.email,
        ip: cliente.ip,
        userAgent: cliente.userAgent,
      })
      throw ApiException.accountLocked(this.calcularRetryAfter(usuario.bloqueadoHasta))
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash)
    if (!passwordValido) {
      const bloqueadoHasta = await this.registrarIntentoFallido(
        usuario.id,
        usuario.intentosFallidos,
        usuario.bloqueadoHasta,
      )
      if (bloqueadoHasta) {
        await this.eventos.registrar({
          tipo: "LOGIN_BLOQUEADO",
          usuarioId: usuario.id,
          email: usuario.email,
          ip: cliente.ip,
          userAgent: cliente.userAgent,
          metadata: { motivo: "max_intentos_fallidos" },
        })
        throw ApiException.accountLocked(this.calcularRetryAfter(bloqueadoHasta))
      }
      await this.eventos.registrar({
        tipo: "LOGIN_FALLIDO",
        usuarioId: usuario.id,
        email: usuario.email,
        ip: cliente.ip,
        userAgent: cliente.userAgent,
        metadata: { motivo: "password_invalido" },
      })
      throw ApiException.invalidCredentials()
    }

    // Password OK: limpiar contadores en cualquier rama posterior.
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    })

    if (usuario.mfaActivado) {
      const emailEnmascarado = this.enmascararEmail(usuario.email)
      // mfaConfirmadoEn=null => primera vez, debe configurar (escanear QR).
      // mfaConfirmadoEn=fecha => ya configurado, solo verificar codigo.
      if (usuario.mfaConfirmadoEn === null) {
        return { tipo: "mfa-setup-pendiente", usuarioId: usuario.id, emailEnmascarado }
      }
      return { tipo: "mfa-verify-pendiente", usuarioId: usuario.id, emailEnmascarado }
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLoginEn: new Date() },
    })
    await this.eventos.registrar({
      tipo: "LOGIN_OK",
      usuarioId: usuario.id,
      email: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    })

    return { tipo: "sesion", usuario: this.aPublico(usuario) }
  }

  async confirmarLoginPostMfa(
    usuarioId: string,
    cliente: DatosCliente = {},
  ): Promise<UsuarioSesion> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario || usuario.bloqueado) {
      throw ApiException.invalidCredentials()
    }
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLoginEn: new Date() },
    })
    await this.eventos.registrar({
      tipo: "LOGIN_OK",
      usuarioId: usuario.id,
      email: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
      metadata: { via: "mfa" },
    })
    return this.aPublico(usuario)
  }

  private enmascararEmail(email: string): string {
    const [user, domain] = email.split("@")
    if (!(user && domain)) {
      return email
    }
    if (user.length <= 2) {
      return `${user[0]}***@${domain}`
    }
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
  }

  async cambiarPassword(
    usuarioId: string,
    passwordActual: string,
    passwordNuevo: string,
    cliente: DatosCliente = {},
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true, passwordHash: true, bloqueado: true },
    })

    if (!usuario || usuario.bloqueado) {
      throw new UnauthorizedException("Sesion no valida")
    }

    const passwordValido = await bcrypt.compare(passwordActual, usuario.passwordHash)
    if (!passwordValido) {
      throw new BadRequestException("La contraseña actual es incorrecta")
    }

    const nuevoHash = await bcrypt.hash(passwordNuevo, BCRYPT_ROUNDS)

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        passwordHash: nuevoHash,
        debeCambiarPassword: false,
        passwordCambiadoEn: new Date(),
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
    })
    await this.eventos.registrar({
      tipo: "PASSWORD_CAMBIADO",
      usuarioId: usuario.id,
      email: usuario.email,
      ip: cliente.ip,
      userAgent: cliente.userAgent,
    })
  }

  async obtenerPorId(id: string): Promise<UsuarioSesion | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } })
    if (!usuario || usuario.bloqueado) {
      return null
    }
    return this.aPublico(usuario)
  }

  private async registrarIntentoFallido(
    id: string,
    intentosActuales: number,
    bloqueadoHasta: Date | null,
  ): Promise<Date | null> {
    const intentos = intentosActuales + 1
    const bloquear = intentos >= MAX_INTENTOS
    const nuevoBloqueo = bloquear
      ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
      : bloqueadoHasta
    await this.prisma.usuario.update({
      where: { id },
      data: {
        intentosFallidos: intentos,
        bloqueadoHasta: nuevoBloqueo,
      },
    })
    return bloquear ? nuevoBloqueo : null
  }

  private calcularRetryAfter(bloqueadoHasta: Date): number {
    return Math.max(0, Math.ceil((bloqueadoHasta.getTime() - Date.now()) / 1000))
  }

  private aPublico(usuario: {
    id: string
    email: string
    nombre: string
    apellido: string
    rol: string
    debeCambiarPassword: boolean
    mfaActivado: boolean
  }): UsuarioSesion {
    const rol = usuario.rol === "ADMIN" ? "ADMIN" : "PARTICIPANTE"
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol,
      debeCambiarPassword: usuario.debeCambiarPassword,
      mfaEnabled: usuario.mfaActivado,
    }
  }
}
