import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import bcrypt from "bcrypt"
import { PrismaService } from "../common/prisma/prisma.service"
import type { UsuarioSesion } from "./tipos"

const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 15
const BCRYPT_ROUNDS = 12

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validarCredenciales(email: string, password: string): Promise<UsuarioSesion> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (!usuario?.activo) {
      throw new UnauthorizedException("Credenciales invalidas")
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      throw new UnauthorizedException(
        `Cuenta bloqueada hasta ${usuario.bloqueadoHasta.toISOString()}`,
      )
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash)
    if (!passwordValido) {
      await this.registrarIntentoFallido(
        usuario.id,
        usuario.intentosFallidos,
        usuario.bloqueadoHasta,
      )
      throw new UnauthorizedException("Credenciales invalidas")
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoLoginEn: new Date(),
      },
    })

    return this.aPublico(usuario)
  }

  async cambiarPassword(
    usuarioId: string,
    passwordActual: string,
    passwordNuevo: string,
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, passwordHash: true, activo: true },
    })

    if (!usuario?.activo) {
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
  }

  async obtenerPorId(id: string): Promise<UsuarioSesion | null> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } })
    if (!usuario?.activo) {
      return null
    }
    return this.aPublico(usuario)
  }

  private async registrarIntentoFallido(
    id: string,
    intentosActuales: number,
    bloqueadoHasta: Date | null,
  ): Promise<void> {
    const intentos = intentosActuales + 1
    const bloquear = intentos >= MAX_INTENTOS
    await this.prisma.usuario.update({
      where: { id },
      data: {
        intentosFallidos: intentos,
        bloqueadoHasta: bloquear
          ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
          : bloqueadoHasta,
      },
    })
  }

  private aPublico(usuario: {
    id: string
    email: string
    nombre: string
    apellido: string
    rol: string
    avatar: string | null
    debeCambiarPassword: boolean
    mfaEnabled: boolean
  }): UsuarioSesion {
    const rol = usuario.rol === "ADMIN" ? "ADMIN" : "PARTICIPANTE"
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol,
      avatar: usuario.avatar,
      debeCambiarPassword: usuario.debeCambiarPassword,
      mfaEnabled: usuario.mfaEnabled,
    }
  }
}
