import { NotImplementedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { beforeEach, describe, expect, it } from "vitest"
import type { AppEnv } from "../../../config/env.validation"
import { ClaudeProvider } from "./claude.provider"

function buildConfig(overrides: Record<string, unknown> = {}): ConfigService<AppEnv, true> {
  const values: Record<string, unknown> = {
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_API_KEY: "sk-mock-test-key-1234567890",
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_TIMEOUT_MS: 30_000,
    ...overrides,
  }
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService<AppEnv, true>
}

describe("ClaudeProvider (P8a — esqueleto dormido)", () => {
  let provider: ClaudeProvider

  beforeEach(() => {
    provider = new ClaudeProvider(buildConfig())
  })

  it("expone providerName='claude'", () => {
    expect(provider.providerName).toBe("claude")
  })

  it("evaluarRepoCualitativo lanza NotImplementedException con TODO(P8b)", async () => {
    await expect(
      provider.evaluarRepoCualitativo({
        repoUrl: "https://github.com/foo/bar",
        profundidad: "SEMI_SENIOR",
      }),
    ).rejects.toThrow(NotImplementedException)
  })

  it("mantenerTurnoComprension lanza NotImplementedException con TODO(P8b)", async () => {
    await expect(
      provider.mantenerTurnoComprension({
        repoUrl: "https://github.com/foo/bar",
        profundidad: "JUNIOR",
        turnoIndex: 0,
        transcripcionPrevia: [],
      }),
    ).rejects.toThrow(NotImplementedException)
  })

  it("mantenerTurnoEntrevista lanza NotImplementedException con TODO(P8c)", async () => {
    await expect(
      provider.mantenerTurnoEntrevista({
        profundidad: "SENIOR",
        turnoIndex: 0,
        mensajeColaborador: "hola",
      }),
    ).rejects.toThrow(NotImplementedException)
  })

  it("constructor lanza si AI_API_KEY ausente (fail-fast)", () => {
    expect(
      () =>
        new ClaudeProvider(
          buildConfig({
            // biome-ignore lint/style/useNamingConvention: key refleja nombre POSIX de env.
            AI_API_KEY: undefined,
          }),
        ),
    ).toThrow(/AI_API_KEY/)
  })
})
