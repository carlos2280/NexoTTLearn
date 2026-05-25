import { ModoEntregaPassword } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CifradoService } from "../../common/crypto/cifrado.service"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ResendEmailProvider } from "./resend-email-provider.service"

const enviarMock = vi.fn()

// Sustituye la SDK `resend` por una fabrica controlada — los tests jamas
// abren un socket de red.
vi.mock("resend", () => ({
  // biome-ignore lint/style/useNamingConvention: `Resend` es el export con nombre publico de la SDK; el mock debe reproducir literalmente la forma del modulo (`{ Resend }`) para que `new Resend(apiKey)` funcione tras el alias.
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: enviarMock },
  })),
}))

interface PrismaMock {
  configuracionSistema: { findUnique: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return { configuracionSistema: { findUnique: vi.fn() } }
}

class CifradoStub {
  desencriptar(payload: string): string {
    if (payload === "ENC_INVALIDO") {
      throw new Error("payload corrupto")
    }
    return `re_${payload}`
  }
}

function buildArgs() {
  return {
    to: "destino@nexott.app",
    subject: "Asunto",
    html: "<p>hola</p>",
    text: "hola",
  }
}

describe("ResendEmailProvider.enviar", () => {
  let prisma: PrismaMock
  let provider: ResendEmailProvider

  beforeEach(() => {
    prisma = buildPrismaMock()
    provider = new ResendEmailProvider(
      prisma as unknown as PrismaService,
      new CifradoStub() as unknown as CifradoService,
    )
    enviarMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("devuelve flag-deshabilitado cuando modoEntregaPassword=MANUAL", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.MANUAL,
      resendApiKeyCifrada: "ENC_OK",
    })

    const r = await provider.enviar(buildArgs())

    expect(r).toEqual({ enviado: false, motivo: "flag-deshabilitado" })
    expect(enviarMock).not.toHaveBeenCalled()
  })

  it("devuelve flag-deshabilitado cuando AUTOMATICO pero falta la API key cifrada", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
      resendApiKeyCifrada: null,
    })

    const r = await provider.enviar(buildArgs())

    expect(r).toEqual({ enviado: false, motivo: "flag-deshabilitado" })
    expect(enviarMock).not.toHaveBeenCalled()
  })

  it("devuelve flag-deshabilitado cuando ConfiguracionSistema no existe aun", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue(null)

    const r = await provider.enviar(buildArgs())

    expect(r).toEqual({ enviado: false, motivo: "flag-deshabilitado" })
    expect(enviarMock).not.toHaveBeenCalled()
  })

  it("devuelve flag-deshabilitado cuando el descifrado de la key falla", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
      resendApiKeyCifrada: "ENC_INVALIDO",
    })

    const r = await provider.enviar(buildArgs())

    expect(r).toEqual({ enviado: false, motivo: "flag-deshabilitado" })
    expect(enviarMock).not.toHaveBeenCalled()
  })

  it("devuelve enviado:true cuando Resend responde sin error en modo AUTOMATICO", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
      resendApiKeyCifrada: "ENC_OK",
    })
    enviarMock.mockResolvedValue({ data: { id: "rsd_1" }, error: null })

    const r = await provider.enviar(buildArgs())

    expect(r).toEqual({ enviado: true })
    expect(enviarMock).toHaveBeenCalledTimes(1)
    const llamada = enviarMock.mock.calls[0]?.[0] as { from: string; to: string }
    expect(llamada.from).toMatch(/notificaciones@nexott\.app/)
    expect(llamada.to).toBe("destino@nexott.app")
  })

  it("mapea error de Resend a error-resend con detalle truncado", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
      resendApiKeyCifrada: "ENC_OK",
    })
    enviarMock.mockResolvedValue({ data: null, error: { message: "rate limited" } })

    const r = await provider.enviar(buildArgs())

    expect(r.enviado).toBe(false)
    if (!r.enviado) {
      expect(r.motivo).toBe("error-resend")
      expect(r.detalle).toContain("rate limited")
    }
  })

  it("trunca el detalle del error a 500 chars", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
      resendApiKeyCifrada: "ENC_OK",
    })
    const mensajeLargo = "x".repeat(800)
    enviarMock.mockRejectedValue(new Error(mensajeLargo))

    const r = await provider.enviar(buildArgs())

    expect(r.enviado).toBe(false)
    if (!r.enviado) {
      expect(r.detalle?.length).toBeLessThanOrEqual(500)
    }
  })

  it("redacta cualquier API key tipo re_xxx en el detalle (R-S10-3)", async () => {
    prisma.configuracionSistema.findUnique.mockResolvedValue({
      modoEntregaPassword: ModoEntregaPassword.AUTOMATICO,
      resendApiKeyCifrada: "ENC_OK",
    })
    enviarMock.mockResolvedValue({
      data: null,
      error: { message: "invalid key re_AbCdEfGhIj_12345" },
    })

    const r = await provider.enviar(buildArgs())

    expect(r.enviado).toBe(false)
    if (!r.enviado) {
      expect(r.detalle).not.toMatch(/re_AbCdEfGhIj/)
      expect(r.detalle).toContain("[REDACTED]")
    }
  })
})
