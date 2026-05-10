import { BadRequestException, UnauthorizedException } from "@nestjs/common"
import bcrypt from "bcrypt"
import { describe, expect, it, vi } from "vitest"
import { ApiException } from "../common/errors/api-exception"
import type { AuthEventosService } from "./auth-eventos.service"
import { AuthService } from "./auth.service"

interface UsuarioMock {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  passwordHash: string
  bloqueado: boolean
  intentosFallidos: number
  bloqueadoHasta: Date | null
  mfaActivado: boolean
  mfaConfirmadoEn: Date | null
  debeCambiarPassword: boolean
}

const PASSWORD_HASH = bcrypt.hashSync("Password1234!", 4)

function buildUsuario(overrides: Partial<UsuarioMock> = {}): UsuarioMock {
  return {
    id: "user-1",
    email: "user@example.com",
    nombre: "User",
    apellido: "Demo",
    rol: "PARTICIPANTE",
    passwordHash: PASSWORD_HASH,
    bloqueado: false,
    intentosFallidos: 0,
    bloqueadoHasta: null,
    mfaActivado: false,
    mfaConfirmadoEn: null,
    debeCambiarPassword: false,
    ...overrides,
  }
}

function buildService(usuario: UsuarioMock | null = buildUsuario()) {
  const findUnique = vi.fn().mockResolvedValue(usuario)
  const update = vi.fn().mockResolvedValue(usuario)
  const prisma = { usuario: { findUnique, update } } as never

  const eventos = {
    registrar: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthEventosService

  const service = new AuthService(prisma, eventos)
  return { service, prisma, eventos, findUnique, update }
}

async function expectApiException(
  promise: Promise<unknown>,
  expected: { code: string; status: number },
) {
  await expect(promise).rejects.toBeInstanceOf(ApiException)
  try {
    await promise
  } catch (err) {
    const ex = err as ApiException
    const body = ex.getResponse() as { code: string }
    expect(body.code).toBe(expected.code)
    expect(ex.getStatus()).toBe(expected.status)
  }
}

describe("AuthService.validarCredenciales", () => {
  describe("credenciales invalidas", () => {
    it("usuario no existe → INVALID_CREDENTIALS + LOGIN_FALLIDO", async () => {
      const { service, eventos } = buildService(null)
      await expectApiException(service.validarCredenciales("nope@x.com", "pwd"), {
        code: "INVALID_CREDENTIALS",
        status: 401,
      })
      expect(eventos.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "LOGIN_FALLIDO",
          metadata: { motivo: "usuario_inexistente_o_bloqueado" },
        }),
      )
    })

    it("usuario bloqueado → INVALID_CREDENTIALS (no leak de status)", async () => {
      const { service } = buildService(buildUsuario({ bloqueado: true }))
      await expectApiException(service.validarCredenciales("user@example.com", "Password1234!"), {
        code: "INVALID_CREDENTIALS",
        status: 401,
      })
    })

    it("password incorrecta → INVALID_CREDENTIALS + LOGIN_FALLIDO motivo password", async () => {
      const { service, eventos } = buildService()
      await expectApiException(service.validarCredenciales("user@example.com", "wrong-pwd"), {
        code: "INVALID_CREDENTIALS",
        status: 401,
      })
      expect(eventos.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "LOGIN_FALLIDO",
          metadata: { motivo: "password_invalido" },
        }),
      )
    })
  })

  describe("lockout boundaries", () => {
    it("4 intentos previos + 1 mas (=5) → bloquea cuenta y lanza ACCOUNT_LOCKED", async () => {
      const usuario = buildUsuario({ intentosFallidos: 4 })
      const { service, eventos, update } = buildService(usuario)

      await expectApiException(service.validarCredenciales("user@example.com", "wrong-pwd"), {
        code: "ACCOUNT_LOCKED",
        status: 423,
      })

      // Update llamado con intentos=5 y bloqueadoHasta != null (15min adelante)
      const updateCall = update.mock.calls[0]?.[0] as {
        data: { intentosFallidos: number; bloqueadoHasta: Date | null }
      }
      expect(updateCall.data.intentosFallidos).toBe(5)
      expect(updateCall.data.bloqueadoHasta).toBeInstanceOf(Date)

      expect(eventos.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "LOGIN_BLOQUEADO",
          metadata: { motivo: "max_intentos_fallidos" },
        }),
      )
    })

    it("3 intentos previos + 1 mas (=4) → NO bloquea, solo incrementa", async () => {
      const usuario = buildUsuario({ intentosFallidos: 3 })
      const { service, eventos, update } = buildService(usuario)

      await expectApiException(service.validarCredenciales("user@example.com", "wrong-pwd"), {
        code: "INVALID_CREDENTIALS",
        status: 401,
      })

      const updateCall = update.mock.calls[0]?.[0] as {
        data: { intentosFallidos: number; bloqueadoHasta: Date | null }
      }
      expect(updateCall.data.intentosFallidos).toBe(4)
      expect(updateCall.data.bloqueadoHasta).toBeNull()

      // No emitir LOGIN_BLOQUEADO en este caso
      const tipos = (eventos.registrar as ReturnType<typeof vi.fn>).mock.calls.map(
        (c) => (c[0] as { tipo: string }).tipo,
      )
      expect(tipos).not.toContain("LOGIN_BLOQUEADO")
    })

    it("cuenta ya bloqueada (bloqueadoHasta futuro) → ACCOUNT_LOCKED sin tocar password", async () => {
      const futuro = new Date(Date.now() + 10 * 60_000)
      const usuario = buildUsuario({ bloqueadoHasta: futuro })
      const { service, eventos } = buildService(usuario)

      // password correcta, pero la cuenta esta bloqueada
      await expectApiException(service.validarCredenciales("user@example.com", "Password1234!"), {
        code: "ACCOUNT_LOCKED",
        status: 423,
      })
      expect(eventos.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: "LOGIN_BLOQUEADO" }),
      )
    })

    it("bloqueadoHasta vencido + password correcta → permite login y limpia contadores", async () => {
      const pasado = new Date(Date.now() - 1000)
      const usuario = buildUsuario({ bloqueadoHasta: pasado, intentosFallidos: 5 })
      const { service, update } = buildService(usuario)

      const result = await service.validarCredenciales("user@example.com", "Password1234!")
      expect(result.tipo).toBe("sesion")

      // Encuentra el update que limpia los contadores
      const updateCalls = update.mock.calls.map((c) => c[0] as { data: Record<string, unknown> })
      const limpieza = updateCalls.find(
        (call) => call.data.intentosFallidos === 0 && call.data.bloqueadoHasta === null,
      )
      expect(limpieza).toBeDefined()
    })
  })

  describe("login OK sin MFA", () => {
    it("devuelve tipo=sesion + UsuarioSesion + emite LOGIN_OK", async () => {
      const { service, eventos } = buildService()

      const result = await service.validarCredenciales("user@example.com", "Password1234!")
      expect(result.tipo).toBe("sesion")
      if (result.tipo === "sesion") {
        expect(result.usuario.email).toBe("user@example.com")
        expect(result.usuario.rol).toBe("PARTICIPANTE")
      }
      expect(eventos.registrar).toHaveBeenCalledWith(expect.objectContaining({ tipo: "LOGIN_OK" }))
    })

    it("rol ADMIN se preserva en UsuarioSesion", async () => {
      const { service } = buildService(buildUsuario({ rol: "ADMIN" }))
      const result = await service.validarCredenciales("user@example.com", "Password1234!")
      if (result.tipo === "sesion") {
        expect(result.usuario.rol).toBe("ADMIN")
      }
    })

    it("rol desconocido se normaliza a PARTICIPANTE", async () => {
      const { service } = buildService(buildUsuario({ rol: "OTRO" }))
      const result = await service.validarCredenciales("user@example.com", "Password1234!")
      if (result.tipo === "sesion") {
        expect(result.usuario.rol).toBe("PARTICIPANTE")
      }
    })
  })

  describe("login OK con MFA — branching setup vs verify", () => {
    it("mfaActivado=true + mfaConfirmadoEn=null → mfa-setup-pendiente con email enmascarado", async () => {
      const { service } = buildService(
        buildUsuario({ mfaActivado: true, mfaConfirmadoEn: null, email: "javier@nttdata.com" }),
      )
      const result = await service.validarCredenciales("javier@nttdata.com", "Password1234!")
      expect(result.tipo).toBe("mfa-setup-pendiente")
      if (result.tipo === "mfa-setup-pendiente") {
        expect(result.usuarioId).toBe("user-1")
        expect(result.emailEnmascarado).toContain("***")
        expect(result.emailEnmascarado).toContain("@nttdata.com")
      }
    })

    it("mfaActivado=true + mfaConfirmadoEn=fecha → mfa-verify-pendiente", async () => {
      const { service } = buildService(
        buildUsuario({ mfaActivado: true, mfaConfirmadoEn: new Date("2025-01-01") }),
      )
      const result = await service.validarCredenciales("user@example.com", "Password1234!")
      expect(result.tipo).toBe("mfa-verify-pendiente")
    })

    it("en flujo MFA NO emite LOGIN_OK (eso ocurre tras verify/setup)", async () => {
      const { service, eventos } = buildService(
        buildUsuario({ mfaActivado: true, mfaConfirmadoEn: null }),
      )
      await service.validarCredenciales("user@example.com", "Password1234!")
      const tipos = (eventos.registrar as ReturnType<typeof vi.fn>).mock.calls.map(
        (c) => (c[0] as { tipo: string }).tipo,
      )
      expect(tipos).not.toContain("LOGIN_OK")
    })
  })
})

describe("AuthService.confirmarLoginPostMfa", () => {
  it("devuelve UsuarioSesion + emite LOGIN_OK con metadata via=mfa", async () => {
    const { service, eventos } = buildService()
    const usuario = await service.confirmarLoginPostMfa("user-1", { ip: "1.1.1.1" })
    expect(usuario.email).toBe("user@example.com")
    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "LOGIN_OK",
        metadata: { via: "mfa" },
      }),
    )
  })

  it("usuario bloqueado → INVALID_CREDENTIALS", async () => {
    const { service } = buildService(buildUsuario({ bloqueado: true }))
    await expectApiException(service.confirmarLoginPostMfa("user-1"), {
      code: "INVALID_CREDENTIALS",
      status: 401,
    })
  })
})

describe("AuthService.cambiarPassword", () => {
  it("happy path: hashea, marca debeCambiarPassword=false, limpia lockout, registra evento", async () => {
    const { service, eventos, update } = buildService()
    await service.cambiarPassword("user-1", "Password1234!", "NuevoPwd5678!", { ip: "1.1.1.1" })

    const data = update.mock.calls[0]?.[0] as {
      data: {
        passwordHash: string
        debeCambiarPassword: boolean
        intentosFallidos: number
        bloqueadoHasta: Date | null
      }
    }
    expect(data.data.passwordHash).not.toBe(PASSWORD_HASH) // distinto al original
    expect(data.data.debeCambiarPassword).toBe(false)
    expect(data.data.intentosFallidos).toBe(0)
    expect(data.data.bloqueadoHasta).toBeNull()

    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "PASSWORD_CAMBIADO" }),
    )
  })

  it("password actual incorrecta → BadRequestException, no muta nada", async () => {
    const { service, update } = buildService()
    await expect(service.cambiarPassword("user-1", "wrong-pwd", "NuevoPwd5678!")).rejects.toThrow(
      BadRequestException,
    )
    expect(update).not.toHaveBeenCalled()
  })

  it("usuario no existe / inactivo → UnauthorizedException", async () => {
    const { service } = buildService(null)
    await expect(service.cambiarPassword("user-1", "Password1234!", "Nuevo")).rejects.toThrow(
      UnauthorizedException,
    )
  })
})

describe("AuthService.obtenerPorId", () => {
  it("devuelve UsuarioSesion si no bloqueado", async () => {
    const { service } = buildService()
    const usuario = await service.obtenerPorId("user-1")
    expect(usuario?.email).toBe("user@example.com")
  })

  it("devuelve null si no existe", async () => {
    const { service } = buildService(null)
    expect(await service.obtenerPorId("nope")).toBeNull()
  })

  it("devuelve null si bloqueado", async () => {
    const { service } = buildService(buildUsuario({ bloqueado: true }))
    expect(await service.obtenerPorId("user-1")).toBeNull()
  })
})
