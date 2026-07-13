import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AppEnv } from "../../../config/env.validation"
import { ClaudeProvider } from "./claude.provider"

// Mock del SDK Anthropic. La factory de `vi.mock` se hoist y NO puede capturar
// variables del scope; definimos APIError + cliente DENTRO del callback.
vi.mock("@anthropic-ai/sdk", () => {
  class InnerApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message)
      this.name = "APIError"
    }
  }
  class MockAnthropic {
    messages: { create: ReturnType<typeof vi.fn> }
    // biome-ignore lint/style/useNamingConvention: shape exigido por el SDK (Anthropic.APIError).
    static APIError = InnerApiError
    constructor(_opts: unknown) {
      this.messages = { create: vi.fn() }
    }
  }
  return { default: MockAnthropic }
})

// Obtenemos APIError reflejandolo del mock para uso en los tests. La forma es
// la unica que pasa los `instanceof` del provider.
async function getApiErrorClass(): Promise<
  new (
    status: number,
    message: string,
  ) => Error & { status: number }
> {
  const mod = (await import("@anthropic-ai/sdk")) as unknown as {
    default: {
      // biome-ignore lint/style/useNamingConvention: shape exigido por el SDK Anthropic.
      APIError: new (
        status: number,
        message: string,
      ) => Error & { status: number }
    }
  }
  return mod.default.APIError
}

function buildConfig(overrides: Record<string, unknown> = {}): ConfigService<AppEnv, true> {
  const values: Record<string, unknown> = {
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_API_KEY: "sk-mock-test-key-1234567890",
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_TIMEOUT_MS: 30_000,
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_MAX_TOKENS: 4096,
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_MODEL_JUNIOR: "claude-haiku-test",
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_MODEL_SEMI_SENIOR: "claude-sonnet-test",
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_MODEL_SENIOR: "claude-opus-test",
    // biome-ignore lint/style/useNamingConvention: keys reflejan nombres POSIX de env.
    AI_MODEL_OVERRIDE: undefined,
    ...overrides,
  }
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService<AppEnv, true>
}

interface ProviderInternals {
  client: { messages: { create: ReturnType<typeof vi.fn> } }
}

function asInternals(provider: ClaudeProvider): ProviderInternals {
  return provider as unknown as ProviderInternals
}

const CONTENIDO_OK = "===== index.ts =====\nexport const suma = (a: number, b: number) => a + b"

/** JSON del informe cualitativo rico (shape `aiInformeCualitativoSchema`). */
function informeJson(overrides?: {
  nota?: number | null
  porDimension?: { dimension: string; nota: number | null; comentario: string }[]
}): string {
  return JSON.stringify({
    nota: overrides?.nota === undefined ? 87 : overrides.nota,
    confianza: "alta",
    resumen: "Buen trabajo general.",
    queReviso: "estructura, nombres, tests",
    queNoReviso: "no ejecuto el codigo",
    porDimension: overrides?.porDimension ?? [],
    fortalezas: ["estructura clara"],
    aReforzar: [{ que: "tests", sugerencia: "añadir casos borde" }],
  })
}

/**
 * Construye el objeto `usage` con el shape snake_case que exige el SDK
 * Anthropic, oculto detras de un helper para no contaminar el spec con
 * `biome-ignore` por cada propiedad.
 */
function usageMock(input: {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheRead?: number
  readonly cacheCreation?: number
}): unknown {
  const entries: [string, number][] = [
    ["input_tokens", input.inputTokens],
    ["output_tokens", input.outputTokens],
  ]
  if (input.cacheRead !== undefined) {
    entries.push(["cache_read_input_tokens", input.cacheRead])
  }
  if (input.cacheCreation !== undefined) {
    entries.push(["cache_creation_input_tokens", input.cacheCreation])
  }
  return Object.fromEntries(entries)
}

function mockFetchSiempreOk(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ status: 200 })),
  )
}

describe("ClaudeProvider (P8b — activo)", () => {
  let provider: ClaudeProvider
  let ApiErrorClass: new (status: number, message: string) => Error & { status: number }

  beforeEach(async () => {
    vi.useFakeTimers()
    ApiErrorClass = await getApiErrorClass()
    provider = new ClaudeProvider(buildConfig())
    mockFetchSiempreOk()
    // Silenciar logs del provider para no contaminar el output.
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined)
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)
  })

  it("expone providerName='claude'", () => {
    expect(provider.providerName).toBe("claude")
  })

  it("evaluarRepoCualitativo OK devuelve el informe rico tras parsear JSON", async () => {
    asInternals(provider).client.messages.create.mockResolvedValueOnce({
      model: "claude-sonnet-test",
      content: [{ type: "text", text: informeJson() }],
      usage: usageMock({ inputTokens: 100, outputTokens: 50, cacheRead: 10, cacheCreation: 20 }),
    })
    const r = await provider.evaluarRepoCualitativo({
      contenidoRepo: CONTENIDO_OK,
      profundidad: "SEMI_SENIOR",
      dimensiones: [],
    })
    expect(r.nota).toBe(87)
    expect(r.confianza).toBe("alta")
    expect(r.resumen).toBe("Buen trabajo general.")
    expect(r.queNoReviso).toMatch(/no ejecuto/)
    expect(r.aReforzar).toHaveLength(1)
  })

  it("evaluarRepoCualitativo reconcilia porDimension contra los ejes pedidos", async () => {
    // La IA omite "Testing" y agrega "Inventada"; el provider debe entregar
    // exactamente los ejes pedidos, con la omitida en null.
    asInternals(provider).client.messages.create.mockResolvedValueOnce({
      model: "claude-sonnet-test",
      content: [
        {
          type: "text",
          text: informeJson({
            porDimension: [
              { dimension: "TypeScript", nota: 90, comentario: "solido" },
              { dimension: "Inventada", nota: 50, comentario: "no pedida" },
            ],
          }),
        },
      ],
      usage: usageMock({ inputTokens: 10, outputTokens: 10 }),
    })
    const r = await provider.evaluarRepoCualitativo({
      contenidoRepo: CONTENIDO_OK,
      profundidad: "SEMI_SENIOR",
      dimensiones: ["TypeScript", "Testing"],
    })
    expect(r.porDimension.map((d) => d.dimension)).toEqual(["TypeScript", "Testing"])
    expect(r.porDimension[0]?.nota).toBe(90)
    expect(r.porDimension[1]?.nota).toBeNull()
  })

  it("evaluarRepoCualitativo shape inesperado -> BadRequestException", async () => {
    asInternals(provider).client.messages.create.mockResolvedValueOnce({
      model: "claude-sonnet-test",
      // JSON válido pero con el shape viejo (sin campos ricos requeridos).
      content: [{ type: "text", text: '{"nota": 80, "comentario": "ok", "confianza": "alta"}' }],
      usage: usageMock({ inputTokens: 1, outputTokens: 1 }),
    })
    await expect(
      provider.evaluarRepoCualitativo({
        contenidoRepo: CONTENIDO_OK,
        profundidad: "JUNIOR",
        dimensiones: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("status 429 -> ServiceUnavailableException iaTemporalmenteSaturada", async () => {
    asInternals(provider).client.messages.create.mockRejectedValueOnce(
      new ApiErrorClass(429, "rate limit"),
    )
    await expect(
      provider.evaluarRepoCualitativo({
        contenidoRepo: CONTENIDO_OK,
        profundidad: "JUNIOR",
        dimensiones: [],
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it("status 401 -> InternalServerErrorException iaCredencialesInvalidas", async () => {
    asInternals(provider).client.messages.create.mockRejectedValueOnce(
      new ApiErrorClass(401, "unauthorized"),
    )
    await expect(
      provider.evaluarRepoCualitativo({
        contenidoRepo: CONTENIDO_OK,
        profundidad: "JUNIOR",
        dimensiones: [],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("status 400 -> BadRequestException iaRespuestaMalformada", async () => {
    asInternals(provider).client.messages.create.mockRejectedValueOnce(
      new ApiErrorClass(400, "invalid"),
    )
    await expect(
      provider.evaluarRepoCualitativo({
        contenidoRepo: CONTENIDO_OK,
        profundidad: "JUNIOR",
        dimensiones: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("dos 5xx + tercer OK -> devuelve respuesta tras backoff", async () => {
    const create = asInternals(provider).client.messages.create
    create
      .mockRejectedValueOnce(new ApiErrorClass(503, "down"))
      .mockRejectedValueOnce(new ApiErrorClass(502, "down"))
      .mockResolvedValueOnce({
        model: "claude-sonnet-test",
        content: [{ type: "text", text: informeJson({ nota: 75 }) }],
        usage: usageMock({ inputTokens: 1, outputTokens: 1 }),
      })
    const p = provider.evaluarRepoCualitativo({
      contenidoRepo: CONTENIDO_OK,
      profundidad: "JUNIOR",
      dimensiones: [],
    })
    // Avanzar timers para liberar setTimeout del backoff (1s + 3s).
    await vi.advanceTimersByTimeAsync(5000)
    const r = await p
    expect(r.nota).toBe(75)
    expect(create).toHaveBeenCalledTimes(3)
  })

  it("tres 5xx -> ServiceUnavailableException iaNoDisponible", async () => {
    const create = asInternals(provider).client.messages.create
    create.mockRejectedValue(new ApiErrorClass(503, "down"))
    const p = provider
      .evaluarRepoCualitativo({
        contenidoRepo: CONTENIDO_OK,
        profundidad: "JUNIOR",
        dimensiones: [],
      })
      .catch((err) => err)
    await vi.advanceTimersByTimeAsync(5000)
    const err = await p
    expect(err).toBeInstanceOf(ServiceUnavailableException)
    expect(create).toHaveBeenCalledTimes(3)
  })

  it("respuesta JSON malformada -> BadRequestException iaRespuestaMalformada", async () => {
    asInternals(provider).client.messages.create.mockResolvedValueOnce({
      model: "claude-sonnet-test",
      content: [{ type: "text", text: "esto no es JSON" }],
      usage: usageMock({ inputTokens: 1, outputTokens: 1 }),
    })
    await expect(
      provider.evaluarRepoCualitativo({
        contenidoRepo: CONTENIDO_OK,
        profundidad: "JUNIOR",
        dimensiones: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
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

  it("Logger no recibe contenido del prompt ni del repo (R-S8-10)", async () => {
    const logSpy = vi.spyOn(Logger.prototype, "log")
    asInternals(provider).client.messages.create.mockResolvedValueOnce({
      model: "claude-sonnet-test",
      content: [{ type: "text", text: informeJson({ nota: 70 }) }],
      usage: usageMock({ inputTokens: 100, outputTokens: 50 }),
    })
    await provider.evaluarRepoCualitativo({
      contenidoRepo: "===== secreto.ts =====\nconst token = 'bar-secreto'",
      profundidad: "SEMI_SENIOR",
      dimensiones: [],
    })
    const logCombined = logSpy.mock.calls.map((args) => String(args[0])).join("\n")
    expect(logCombined).not.toContain("bar-secreto")
    expect(logCombined).not.toContain("resumen")
  })
})
