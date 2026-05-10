import {
  ForbiddenException,
  NotImplementedException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { EstadoEmpleado, ModoEntregaPassword, RolUsuario } from "@prisma/client"
import bcrypt from "bcrypt"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { AuthService } from "./auth.service"

interface UsuarioMock {
  id: string
  rol: RolUsuario
  passwordHash: string
  passwordInicialCaduca: Date | null
  requiereCambioPassword: boolean
  intentosFallidos: number
  bloqueado: boolean
  mfaHabilitado: boolean
  ultimoLogin: Date | null
  colaborador: {
    id: string
    email: string
    nombre: string
    estadoEmpleado: EstadoEmpleado
  }
}

function buildUsuario(overrides: Partial<UsuarioMock> = {}): UsuarioMock {
  return {
    id: "usr-1",
    rol: RolUsuario.PARTICIPANTE,
    passwordHash: "$hash$",
    passwordInicialCaduca: null,
    requiereCambioPassword: false,
    intentosFallidos: 0,
    bloqueado: false,
    mfaHabilitado: false,
    ultimoLogin: null,
    colaborador: {
      id: "col-1",
      email: "user@nttdata.test",
      nombre: "Usuario Test",
      estadoEmpleado: EstadoEmpleado.ACTIVO,
    },
    ...overrides,
  }
}

interface MockPrisma {
  usuario: {
    findFirst: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  historicoPassword: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  aceptacionAvisoPrivacidad: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  configuracionSistema: {
    findUnique: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
  $executeRaw: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const prisma: MockPrisma = {
    usuario: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    },
    historicoPassword: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(undefined),
    },
    aceptacionAvisoPrivacidad: {
      findFirst: vi.fn().mockResolvedValue({ id: "aap-1" }),
      create: vi.fn().mockResolvedValue(undefined),
    },
    configuracionSistema: {
      findUnique: vi.fn().mockResolvedValue({ modoEntregaPassword: ModoEntregaPassword.MANUAL }),
    },
    $transaction: vi.fn().mockResolvedValue([undefined, undefined]),
    $executeRaw: vi.fn().mockResolvedValue(0),
  }
  return prisma
}

let prisma: MockPrisma
let service: AuthService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new AuthService(prisma as unknown as PrismaService)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("AuthService.validarCredenciales", () => {
  it("happy path: devuelve perfil y resetea intentos en login exitoso", async () => {
    const usuario = buildUsuario({ passwordHash: await bcrypt.hash("Password1!", 4) })
    prisma.usuario.findFirst.mockResolvedValue(usuario)
    prisma.aceptacionAvisoPrivacidad.findFirst.mockResolvedValue({ id: "aap-1" })

    const { perfil } = await service.validarCredenciales("user@nttdata.test", "Password1!")

    expect(perfil.usuarioId).toBe("usr-1")
    expect(perfil.rol).toBe(RolUsuario.PARTICIPANTE)
    expect(perfil.requiereAceptarAvisoPrivacidad).toBe(false)
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ intentosFallidos: 0 }) }),
    )
  })

  it("email no existe: 401 generico CREDENCIALES_INVALIDAS (sin revelar el email)", async () => {
    prisma.usuario.findFirst.mockResolvedValue(null)
    try {
      await service.validarCredenciales("nope@nttdata.test", "x")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      const r = (error as UnauthorizedException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.credencialesInvalidas)
    }
  })

  it("password incorrecto: incrementa intentos y lanza 401 generico", async () => {
    const usuario = buildUsuario({
      passwordHash: await bcrypt.hash("right", 4),
      intentosFallidos: 2,
    })
    prisma.usuario.findFirst.mockResolvedValue(usuario)

    await expect(service.validarCredenciales(usuario.colaborador.email, "wrong")).rejects.toThrow(
      UnauthorizedException,
    )
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ intentosFallidos: 3 }) }),
    )
  })

  it("5 fallos consecutivos: marca bloqueado=true en el 5to fallo", async () => {
    const usuario = buildUsuario({
      passwordHash: await bcrypt.hash("right", 4),
      intentosFallidos: 4,
    })
    prisma.usuario.findFirst.mockResolvedValue(usuario)

    await expect(service.validarCredenciales(usuario.colaborador.email, "wrong")).rejects.toThrow(
      UnauthorizedException,
    )
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ intentosFallidos: 5, bloqueado: true }),
      }),
    )
  })

  it("usuario bloqueado: 403 USUARIO_BLOQUEADO", async () => {
    prisma.usuario.findFirst.mockResolvedValue(buildUsuario({ bloqueado: true }))
    try {
      await service.validarCredenciales("user@nttdata.test", "x")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException)
      const r = (error as ForbiddenException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.usuarioBloqueado)
    }
  })

  it("ex empleado: 403 USUARIO_EX_EMPLEADO", async () => {
    prisma.usuario.findFirst.mockResolvedValue(
      buildUsuario({
        colaborador: {
          id: "col-1",
          email: "ex@nttdata.test",
          nombre: "Ex",
          estadoEmpleado: EstadoEmpleado.EX_EMPLEADO,
        },
      }),
    )
    try {
      await service.validarCredenciales("ex@nttdata.test", "x")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException)
      const r = (error as ForbiddenException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.usuarioExEmpleado)
    }
  })

  it("password inicial caducada: 403 PASSWORD_INICIAL_CADUCADA", async () => {
    prisma.usuario.findFirst.mockResolvedValue(
      buildUsuario({
        requiereCambioPassword: true,
        passwordInicialCaduca: new Date(Date.now() - 1000),
      }),
    )
    try {
      await service.validarCredenciales("user@nttdata.test", "x")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException)
      const r = (error as ForbiddenException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.passwordInicialCaducada)
    }
  })

  it("mfaHabilitado=true: 501 MFA_PENDIENTE_FASE_P1B", async () => {
    const usuario = buildUsuario({
      mfaHabilitado: true,
      passwordHash: await bcrypt.hash("Password1!", 4),
    })
    prisma.usuario.findFirst.mockResolvedValue(usuario)

    try {
      await service.validarCredenciales("user@nttdata.test", "Password1!")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotImplementedException)
      const r = (error as NotImplementedException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.mfaPendienteFaseP1B)
    }
  })

  it("aviso de privacidad pendiente: requiereAceptarAvisoPrivacidad=true en perfil", async () => {
    const usuario = buildUsuario({ passwordHash: await bcrypt.hash("Password1!", 4) })
    prisma.usuario.findFirst.mockResolvedValue(usuario)
    prisma.aceptacionAvisoPrivacidad.findFirst.mockResolvedValue(null)

    const { perfil } = await service.validarCredenciales(usuario.colaborador.email, "Password1!")
    expect(perfil.requiereAceptarAvisoPrivacidad).toBe(true)
  })
})

describe("AuthService.cambiarPassword", () => {
  it("happy path: actualiza, registra historico e invalida otras sesiones", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: "usr-1",
      passwordHash: await bcrypt.hash("OldPassword1!", 4),
    })
    await service.cambiarPassword("usr-1", "sid-actual", "OldPassword1!", "NewPassword2@")
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.$executeRaw).toHaveBeenCalled()
  })

  it("password actual invalida: 401 PASSWORD_ACTUAL_INVALIDO", async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: "usr-1",
      passwordHash: await bcrypt.hash("OldPassword1!", 4),
    })
    try {
      await service.cambiarPassword("usr-1", "sid", "wrong", "NewPassword2@")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      const r = (error as UnauthorizedException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.passwordActualInvalido)
    }
  })

  it("password nueva debil: 422 VALIDACION_PASSWORD_DEBIL", async () => {
    try {
      await service.cambiarPassword("usr-1", "sid", "x", "weak")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException)
      const r = (error as UnprocessableEntityException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.passwordDebil)
    }
  })

  it("password nueva igual a la actual: 422 VALIDACION_PASSWORD_REPETIDO", async () => {
    const hashActual = await bcrypt.hash("Password1!", 4)
    prisma.usuario.findUnique.mockResolvedValue({ id: "usr-1", passwordHash: hashActual })
    try {
      await service.cambiarPassword("usr-1", "sid", "Password1!", "Password1!")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException)
      const r = (error as UnprocessableEntityException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.passwordRepetido)
    }
  })
})

describe("AuthService.regenerarPasswordInicial", () => {
  it("modo MANUAL: hashea, actualiza usuario, invalida sesiones y devuelve la password", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.MANUAL,
    })
    const resultado = await service.regenerarPasswordInicial("usr-2")
    expect(resultado.modoEntrega).toBe("MANUAL")
    expect(resultado.passwordTemporal.length).toBeGreaterThanOrEqual(12)
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.$executeRaw).toHaveBeenCalled()
  })

  it("modo AUTOMATICO: 501 MODO_AUTOMATICO_NO_DISPONIBLE", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
    })
    try {
      await service.regenerarPasswordInicial("usr-2")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotImplementedException)
      const r = (error as NotImplementedException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.modoAutomaticoNoDisponible)
    }
  })
})

describe("AuthService.desbloquear", () => {
  it("limpia bloqueado e intentos_fallidos", async () => {
    await service.desbloquear("usr-3")
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: "usr-3" },
      data: { bloqueado: false, intentosFallidos: 0 },
    })
  })
})
