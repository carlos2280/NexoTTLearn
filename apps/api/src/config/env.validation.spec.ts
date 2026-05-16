import { describe, expect, it } from "vitest"
import { validateEnv } from "./env.validation"

const SECRETO_MINIMO = "x".repeat(32)
const ENCRYPTION_KEY_VALIDA = "a".repeat(64)
const ENCRYPTION_KEY_PLACEHOLDER = "0".repeat(64)

type Override = readonly [string, string]

function buildEnv(...overrides: readonly Override[]): Record<string, string> {
  const entries = new Map<string, string>([
    ["NODE_ENV", "development"],
    ["DATABASE_URL", "postgresql://user:pass@localhost:5432/db"],
    ["SESSION_SECRET", SECRETO_MINIMO],
    ["SECRETS_ENCRYPTION_KEY", ENCRYPTION_KEY_VALIDA],
  ])
  for (const [key, value] of overrides) {
    entries.set(key, value)
  }
  return Object.fromEntries(entries)
}

describe("validateEnv", () => {
  it("acepta el set minimo valido y aplica defaults", () => {
    const env = validateEnv(buildEnv())
    expect(env.NODE_ENV).toBe("development")
    expect(env.PORT).toBe(4000)
    expect(env.COOKIE_SECURE).toBe(false)
    expect(env.ALLOWED_ORIGINS).toEqual([])
    expect(env.SESSION_SECRET).toBe(SECRETO_MINIMO)
  })

  it("rechaza SESSION_SECRET con menos de 32 caracteres", () => {
    expect(() => validateEnv(buildEnv(["SESSION_SECRET", "x".repeat(10)]))).toThrow(
      /SESSION_SECRET/,
    )
  })

  it("rechaza DATABASE_URL que no sea una URL valida", () => {
    expect(() => validateEnv(buildEnv(["DATABASE_URL", "no-es-una-url"]))).toThrow(/DATABASE_URL/)
  })

  it("rechaza NODE_ENV=production con COOKIE_SECURE=false", () => {
    expect(() =>
      validateEnv(
        buildEnv(
          ["NODE_ENV", "production"],
          ["COOKIE_SECURE", "false"],
          ["ALLOWED_ORIGINS", "https://app.example.com"],
        ),
      ),
    ).toThrow(/COOKIE_SECURE/)
  })

  it("rechaza NODE_ENV=production con ALLOWED_ORIGINS vacio", () => {
    expect(() =>
      validateEnv(
        buildEnv(["NODE_ENV", "production"], ["COOKIE_SECURE", "true"], ["ALLOWED_ORIGINS", ""]),
      ),
    ).toThrow(/ALLOWED_ORIGINS/)
  })

  it("acepta NODE_ENV=production con COOKIE_SECURE=true y ALLOWED_ORIGINS no vacio", () => {
    const env = validateEnv(
      buildEnv(
        ["NODE_ENV", "production"],
        ["COOKIE_SECURE", "true"],
        ["ALLOWED_ORIGINS", "https://app.example.com,https://admin.example.com"],
        ["STORAGE_ROOT", "/data/nexott/storage"],
      ),
    )
    expect(env.COOKIE_SECURE).toBe(true)
    expect(env.ALLOWED_ORIGINS).toEqual(["https://app.example.com", "https://admin.example.com"])
  })

  it("rechaza SECRETS_ENCRYPTION_KEY con longitud distinta de 64", () => {
    expect(() => validateEnv(buildEnv(["SECRETS_ENCRYPTION_KEY", "a".repeat(63)]))).toThrow(
      /SECRETS_ENCRYPTION_KEY/,
    )
  })

  it("rechaza SECRETS_ENCRYPTION_KEY que no sea hex", () => {
    expect(() => validateEnv(buildEnv(["SECRETS_ENCRYPTION_KEY", `${"a".repeat(63)}z`]))).toThrow(
      /SECRETS_ENCRYPTION_KEY/,
    )
  })

  it("rechaza SECRETS_ENCRYPTION_KEY placeholder en NODE_ENV=production", () => {
    expect(() =>
      validateEnv(
        buildEnv(
          ["NODE_ENV", "production"],
          ["COOKIE_SECURE", "true"],
          ["ALLOWED_ORIGINS", "https://app.example.com"],
          ["SECRETS_ENCRYPTION_KEY", ENCRYPTION_KEY_PLACEHOLDER],
        ),
      ),
    ).toThrow(/SECRETS_ENCRYPTION_KEY/)
  })

  it("acepta SECRETS_ENCRYPTION_KEY placeholder en development", () => {
    const env = validateEnv(buildEnv(["SECRETS_ENCRYPTION_KEY", ENCRYPTION_KEY_PLACEHOLDER]))
    expect(env.SECRETS_ENCRYPTION_KEY).toBe(ENCRYPTION_KEY_PLACEHOLDER)
  })

  it("rechaza STORAGE_ROOT relativo en NODE_ENV=production", () => {
    expect(() =>
      validateEnv(
        buildEnv(
          ["NODE_ENV", "production"],
          ["COOKIE_SECURE", "true"],
          ["ALLOWED_ORIGINS", "https://app.example.com"],
          ["STORAGE_ROOT", "apps/api/storage"],
        ),
      ),
    ).toThrow(/STORAGE_ROOT/)
  })

  it("rechaza STORAGE_ROOT en lista negra (/var) en NODE_ENV=production", () => {
    expect(() =>
      validateEnv(
        buildEnv(
          ["NODE_ENV", "production"],
          ["COOKIE_SECURE", "true"],
          ["ALLOWED_ORIGINS", "https://app.example.com"],
          ["STORAGE_ROOT", "/var/data"],
        ),
      ),
    ).toThrow(/STORAGE_ROOT/)
  })

  it("acepta STORAGE_ROOT absoluto fuera de lista negra en NODE_ENV=production", () => {
    const env = validateEnv(
      buildEnv(
        ["NODE_ENV", "production"],
        ["COOKIE_SECURE", "true"],
        ["ALLOWED_ORIGINS", "https://app.example.com"],
        ["STORAGE_ROOT", "/data/nexott/storage"],
      ),
    )
    expect(env.STORAGE_ROOT).toBe("/data/nexott/storage")
  })

  it("acepta STORAGE_ROOT relativo (default) en NODE_ENV=development", () => {
    const env = validateEnv(buildEnv())
    expect(env.STORAGE_ROOT).toBe("apps/api/storage")
  })

  it("aplica defaults de notificaciones (NOTIF_PURGA_CRON y APP_BASE_URL)", () => {
    const env = validateEnv(buildEnv())
    expect(env.NOTIF_PURGA_CRON).toBe("0 3 * * *")
    expect(env.APP_BASE_URL).toBe("http://localhost:4000")
  })

  it("acepta NOTIF_PURGA_CRON con caracteres validos", () => {
    const env = validateEnv(buildEnv(["NOTIF_PURGA_CRON", "*/30 * * * *"]))
    expect(env.NOTIF_PURGA_CRON).toBe("*/30 * * * *")
  })

  it("rechaza NOTIF_PURGA_CRON con caracteres invalidos", () => {
    expect(() => validateEnv(buildEnv(["NOTIF_PURGA_CRON", "@daily"]))).toThrow(/NOTIF_PURGA_CRON/)
  })

  it("rechaza APP_BASE_URL que no sea una URL valida", () => {
    expect(() => validateEnv(buildEnv(["APP_BASE_URL", "no-es-una-url"]))).toThrow(/APP_BASE_URL/)
  })

  it("acepta APP_BASE_URL https en NODE_ENV=production", () => {
    const env = validateEnv(
      buildEnv(
        ["NODE_ENV", "production"],
        ["COOKIE_SECURE", "true"],
        ["ALLOWED_ORIGINS", "https://app.example.com"],
        ["STORAGE_ROOT", "/data/nexott/storage"],
        ["APP_BASE_URL", "https://app.example.com"],
      ),
    )
    expect(env.APP_BASE_URL).toBe("https://app.example.com")
  })
})
