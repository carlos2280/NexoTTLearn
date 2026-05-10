import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiException } from "../../common/errors/api-exception"

// Helper: extrae body + status de un ApiException para asserts ergonomicos.
// ApiException extiende HttpException, guarda body en getResponse() y status en getStatus().
async function expectApiException(
  promise: Promise<unknown>,
  expected: { code: string; status: number; messageContains?: string },
) {
  await expect(promise).rejects.toBeInstanceOf(ApiException)
  try {
    await promise
    throw new Error("Se esperaba que la promesa rechazara")
  } catch (err) {
    const ex = err as ApiException
    const body = ex.getResponse() as { code: string; message: string }
    expect(body.code).toBe(expected.code)
    expect(ex.getStatus()).toBe(expected.status)
    if (expected.messageContains) {
      expect(body.message).toContain(expected.messageContains)
    }
  }
}
import type { AuthEventosService } from "../auth-eventos.service"
import type { MfaChallengeService } from "./mfa-challenge.service"
import type { MfaCryptoService } from "./mfa-crypto.service"
import { MfaService } from "./mfa.service"

// otplib se mockea para controlar el resultado de verify() determinista.
const verifyMock = vi.hoisted(() => vi.fn())
vi.mock("otplib", () => ({
  generateSecret: () => "MOCK_SECRET",
  generateURI: ({ issuer, label, secret }: { issuer: string; label: string; secret: string }) =>
    `otpauth://totp/${issuer}:${label}?secret=${secret}`,
  verify: verifyMock,
}))

interface UsuarioMock {
  id: string
  email: string
  bloqueado: boolean
  mfaActivado: boolean
  mfaSecret: string | null
  mfaConfirmadoEn: Date | null
}

const USUARIO_BASE: UsuarioMock = {
  id: "user-1",
  email: "user@example.com",
  bloqueado: false,
  mfaActivado: true,
  mfaSecret: "ENCRYPTED_SECRET",
  mfaConfirmadoEn: new Date("2025-01-01"),
}

function buildService(usuario: UsuarioMock | null = USUARIO_BASE) {
  const findUnique = vi.fn().mockResolvedValue(usuario)
  const update = vi.fn().mockResolvedValue(usuario)
  const prisma = { usuario: { findUnique, update } } as never

  const crypto = {
    decrypt: vi.fn().mockReturnValue("PLAIN_SECRET"),
    encrypt: vi.fn().mockReturnValue("ENCRYPTED_SECRET"),
  } as unknown as MfaCryptoService

  const challenges = {
    crear: vi.fn().mockReturnValue("challenge-id"),
    obtener: vi.fn().mockReturnValue({ id: "challenge-id", usuarioId: "user-1", intentos: 0 }),
    invalidar: vi.fn(),
    registrarIntentoFallido: vi.fn().mockReturnValue(true),
  } as unknown as MfaChallengeService

  const eventos = {
    registrar: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthEventosService

  const service = new MfaService(prisma, crypto, challenges, eventos)
  return { service, prisma, crypto, challenges, eventos, findUnique, update }
}

beforeEach(() => {
  verifyMock.mockReset()
})

describe("MfaService.iniciarSetup", () => {
  it("regenera secret, lo cifra, lo guarda y devuelve secret + URI + challengeId", async () => {
    const { service, crypto, update, eventos } = buildService({
      ...USUARIO_BASE,
      mfaConfirmadoEn: null,
    })

    const result = await service.iniciarSetup("user-1", { ip: "1.1.1.1" })

    expect(crypto.encrypt).toHaveBeenCalledWith("MOCK_SECRET")
    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { mfaSecret: "ENCRYPTED_SECRET", mfaConfirmadoEn: null },
    })
    expect(result.secret).toBe("MOCK_SECRET")
    expect(result.otpauthUri).toContain("NexoTT Learn")
    expect(result.otpauthUri).toContain("user@example.com")
    expect(result.challengeId).toBe("challenge-id")

    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "MFA_SETUP_INICIADO", usuarioId: "user-1" }),
    )
  })

  it("falla si el usuario no existe o esta bloqueado", async () => {
    const { service } = buildService({ ...USUARIO_BASE, bloqueado: true })

    await expect(service.iniciarSetup("user-1")).rejects.toThrow(ApiException)
  })

  it("falla si el usuario no tiene MFA habilitado", async () => {
    const { service } = buildService({ ...USUARIO_BASE, mfaActivado: false })

    await expect(service.iniciarSetup("user-1")).rejects.toThrow(ApiException)
  })
})

describe("MfaService.verificarChallenge — flujo verify", () => {
  it("happy path: codigo valido, registra MFA_VERIFICADO, devuelve usuarioId", async () => {
    verifyMock.mockResolvedValue({ valid: true })
    const { service, challenges, eventos } = buildService()

    const id = await service.verificarChallenge("challenge-id", "123456", { ip: "2.2.2.2" })

    expect(id).toBe("user-1")
    expect(challenges.invalidar).toHaveBeenCalledWith("challenge-id")
    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "MFA_VERIFICADO", usuarioId: "user-1" }),
    )
  })

  it("challenge inexistente → MFA_EXPIRED 410", async () => {
    const { service, challenges } = buildService()
    ;(challenges.obtener as ReturnType<typeof vi.fn>).mockReturnValue(null)

    await expectApiException(service.verificarChallenge("bad-id", "123456"), {
      code: "MFA_EXPIRED",
      status: 410,
    })
  })

  it("codigo invalido con intentos restantes → MFA_INVALID 401", async () => {
    verifyMock.mockResolvedValue({ valid: false })
    const { service, challenges, eventos } = buildService()
    ;(challenges.registrarIntentoFallido as ReturnType<typeof vi.fn>).mockReturnValue(true)

    await expectApiException(service.verificarChallenge("challenge-id", "999999"), {
      code: "MFA_INVALID",
      status: 401,
    })

    // El evento se registra ANTES del throw
    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MFA_FALLIDO",
        metadata: { contexto: "verify", quedanIntentos: true },
      }),
    )
  })

  it("codigo invalido sin intentos restantes → MFA_EXPIRED 410 (no 401)", async () => {
    verifyMock.mockResolvedValue({ valid: false })
    const { service, challenges } = buildService()
    ;(challenges.registrarIntentoFallido as ReturnType<typeof vi.fn>).mockReturnValue(false)

    await expectApiException(service.verificarChallenge("challenge-id", "999999"), {
      code: "MFA_EXPIRED",
      status: 410,
    })
  })

  it("usuario bloqueado durante verify → MFA_INVALID e invalida challenge", async () => {
    const { service, challenges } = buildService({ ...USUARIO_BASE, bloqueado: true })

    await expectApiException(service.verificarChallenge("challenge-id", "123456"), {
      code: "MFA_INVALID",
      status: 401,
    })
    expect(challenges.invalidar).toHaveBeenCalledWith("challenge-id")
  })
})

describe("MfaService.confirmarSetup — flujo setup", () => {
  it("happy path: marca mfaConfirmadoEn=now, registra MFA_ACTIVADO", async () => {
    verifyMock.mockResolvedValue({ valid: true })
    const { service, update, eventos } = buildService()

    const id = await service.confirmarSetup("challenge-id", "123456", { ip: "3.3.3.3" })

    expect(id).toBe("user-1")
    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { mfaConfirmadoEn: expect.any(Date) },
    })
    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "MFA_ACTIVADO", usuarioId: "user-1" }),
    )
  })

  it("codigo invalido en setup registra contexto=setup en evento", async () => {
    verifyMock.mockResolvedValue({ valid: false })
    const { service, eventos, challenges } = buildService()
    ;(challenges.registrarIntentoFallido as ReturnType<typeof vi.fn>).mockReturnValue(true)

    await expect(service.confirmarSetup("challenge-id", "999999")).rejects.toThrow()

    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: "MFA_FALLIDO",
        metadata: { contexto: "setup", quedanIntentos: true },
      }),
    )
  })

  it("setup expirado tiene mensaje distinto al verify expirado", async () => {
    const { service, challenges } = buildService()
    ;(challenges.obtener as ReturnType<typeof vi.fn>).mockReturnValue(null)

    await expectApiException(service.confirmarSetup("expired", "123456"), {
      code: "MFA_EXPIRED",
      status: 410,
      messageContains: "configuracion expiro",
    })
  })
})
