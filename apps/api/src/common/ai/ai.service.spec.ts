import { ConfigService } from "@nestjs/config"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AppEnv } from "../../config/env.validation"
import { AiService } from "./ai.service"
import { IAiProvider } from "./providers/ai-provider.interface"

function buildConfig(env: Record<string, unknown>): ConfigService<AppEnv, true> {
  return {
    get: (key: string) => env[key],
  } as unknown as ConfigService<AppEnv, true>
}

function buildProvider(): IAiProvider {
  return {
    providerName: "mock",
    evaluarRepoCualitativo: vi.fn().mockResolvedValue({
      nota: 80,
      comentario: "ok",
      confianza: "alta",
    }),
    mantenerTurnoComprension: vi.fn().mockResolvedValue({
      siguientePregunta: null,
      nota: 72,
      finalizado: true,
    }),
    mantenerTurnoEntrevista: vi.fn().mockResolvedValue({
      respuestaIa: "x",
      finalizado: false,
    }),
  }
}

describe("AiService.resolveModel (D-S8-B3)", () => {
  let provider: IAiProvider

  beforeEach(() => {
    provider = buildProvider()
  })

  it("JUNIOR -> modelo haiku", () => {
    const service = new AiService(
      provider,
      buildConfig({
        // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
        AI_MODEL_JUNIOR: "haiku-test",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SEMI_SENIOR: "sonnet-test",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SENIOR: "opus-test",
      }),
    )
    expect(service.resolveModel("JUNIOR")).toBe("haiku-test")
  })

  it("SEMI_SENIOR -> modelo sonnet", () => {
    const service = new AiService(
      provider,
      buildConfig({
        // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
        AI_MODEL_JUNIOR: "h",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SEMI_SENIOR: "sonnet-x",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SENIOR: "o",
      }),
    )
    expect(service.resolveModel("SEMI_SENIOR")).toBe("sonnet-x")
  })

  it("SENIOR -> modelo opus", () => {
    const service = new AiService(
      provider,
      buildConfig({
        // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
        AI_MODEL_JUNIOR: "h",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SEMI_SENIOR: "s",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SENIOR: "opus-x",
      }),
    )
    expect(service.resolveModel("SENIOR")).toBe("opus-x")
  })

  it("AI_MODEL_OVERRIDE pisa todas las profundidades (D-S8-B3)", () => {
    const service = new AiService(
      provider,
      buildConfig({
        // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
        AI_MODEL_JUNIOR: "h",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SEMI_SENIOR: "s",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_SENIOR: "o",
        // biome-ignore lint/style/useNamingConvention: idem.
        AI_MODEL_OVERRIDE: "forzado-test",
      }),
    )
    expect(service.resolveModel("JUNIOR")).toBe("forzado-test")
    expect(service.resolveModel("SEMI_SENIOR")).toBe("forzado-test")
    expect(service.resolveModel("SENIOR")).toBe("forzado-test")
  })

  it("providerName se proxy-ea desde el provider concreto", () => {
    const service = new AiService(provider, buildConfig({}))
    expect(service.providerName).toBe("mock")
  })
})
