import { z } from "zod"

/**
 * Placeholder hex de 64 caracteres de SECRETS_ENCRYPTION_KEY usado en
 * apps/api/.env.example. En NODE_ENV=production se rechaza esta clave para
 * forzar a operaciones a generar una nueva con `openssl rand -hex 32`.
 */
const SECRETS_ENCRYPTION_KEY_PLACEHOLDER = "0".repeat(64)

/**
 * Las claves del schema mapean nombres de variables de entorno
 * (POSIX/Docker/CI), por lo que deben ser SCREAMING_SNAKE_CASE: cambiar a
 * camelCase rompe la lectura de `process.env.*`. Se suprime la regla
 * `useNamingConvention` por linea con justificacion documentada.
 */
const envSchema = z
  .object({
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    PORT: z.coerce.number().int().positive().default(4000),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    DATABASE_URL: z.string().url(),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    SESSION_MAX_AGE_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(8 * 60 * 60 * 1000),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    COOKIE_SECURE: z
      .string()
      .default("false")
      .transform((value) => value.toLowerCase() === "true"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    ALLOWED_ORIGINS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      ),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    SECRETS_ENCRYPTION_KEY: z
      .string()
      .length(64, "SECRETS_ENCRYPTION_KEY debe tener 64 caracteres hex (32 bytes)")
      .regex(/^[0-9a-fA-F]+$/, "SECRETS_ENCRYPTION_KEY debe ser hex"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    STORAGE_ROOT: z.string().min(1).default("apps/api/storage"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") {
      return
    }
    if (!data.COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["COOKIE_SECURE"],
        message: "COOKIE_SECURE debe ser true en NODE_ENV=production",
      })
    }
    if (data.ALLOWED_ORIGINS.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ALLOWED_ORIGINS"],
        message: "ALLOWED_ORIGINS no puede estar vacio en NODE_ENV=production",
      })
    }
    if (data.SECRETS_ENCRYPTION_KEY.toLowerCase() === SECRETS_ENCRYPTION_KEY_PLACEHOLDER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SECRETS_ENCRYPTION_KEY"],
        message:
          "SECRETS_ENCRYPTION_KEY no puede ser el placeholder de desarrollo en NODE_ENV=production",
      })
    }
  })

export type AppEnv = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    const errores = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n")
    throw new Error(`Variables de entorno invalidas:\n${errores}`)
  }
  return result.data
}
