import { isAbsolute, resolve } from "node:path"
import { z } from "zod"

/**
 * Prefijos de paths absolutos prohibidos para STORAGE_ROOT en produccion.
 * El listado cubre raices del sistema y rutas dentro del repo para evitar
 * que un volumen montado quede dentro del checkout de la aplicacion.
 */
const STORAGE_ROOT_BLACKLIST_PROD: readonly string[] = [
  "/",
  "/etc",
  "/var",
  "/usr",
  "/bin",
  "/sbin",
  "/root",
  "/home",
  "/tmp",
]

function storageRootProhibidoEnProd(value: string): string | null {
  const normalizado = resolve(value)
  if (normalizado === "/") {
    return "STORAGE_ROOT no puede ser la raiz del sistema"
  }
  for (const prefijo of STORAGE_ROOT_BLACKLIST_PROD) {
    if (prefijo === "/") {
      continue
    }
    if (normalizado === prefijo || normalizado.startsWith(`${prefijo}/`)) {
      return `STORAGE_ROOT no puede estar dentro de ${prefijo}`
    }
  }
  if (normalizado.endsWith("/apps/api/storage")) {
    return "STORAGE_ROOT en produccion no puede ser apps/api/storage (path interno del repo)"
  }
  return null
}

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
    // ---------------------------------------------------------------------
    // AI provider (Slice 8 P8a — D-S8-B2). Mock por defecto: Vitest jamas
    // toca la nube. ClaudeProvider se activa en P8b cuando AI_PROVIDER=claude
    // y consume AI_API_KEY (obligatoria en ese caso — refine cruzado abajo).
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_PROVIDER: z.enum(["claude", "mock"]).default("mock"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_API_KEY: z.string().min(1).optional(),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_MODEL_JUNIOR: z.string().default("claude-haiku-4-5-20251001"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_MODEL_SEMI_SENIOR: z.string().default("claude-sonnet-4-6"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_MODEL_SENIOR: z.string().default("claude-opus-4-7"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_MODEL_OVERRIDE: z.string().optional(),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    AI_ENABLE_PROMPT_CACHING: z
      .string()
      .default("true")
      .transform((value) => value.toLowerCase() === "true"),
    // ---------------------------------------------------------------------
    // Sandbox de ejecucion de codigo (CODIGO_PREGUNTAS + CODIGO_TESTS).
    //   SANDBOX_PROVIDER  — `piston` (real) o `mock` (tests).
    //   SANDBOX_URL       — endpoint HTTP del sandbox (Piston: http://piston:2000).
    //   SANDBOX_TIMEOUT_MS — timeout total de la llamada al sandbox.
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    SANDBOX_PROVIDER: z.enum(["piston", "mock"]).default("mock"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    SANDBOX_URL: z.string().url().default("http://localhost:2000"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    SANDBOX_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
    // ---------------------------------------------------------------------
    // Notificaciones (Slice 10 P10a — D-S10-B3/B4).
    //   NOTIF_PURGA_CRON  — expresion cron de 5 campos para
    //                       ArchivarNotificacionesCron. Default: cada dia 03:00.
    //   APP_BASE_URL      — URL base de la app, usada en P10c en plantillas
    //                       HTML para construir links a la bandeja. La
    //                       obligatoriedad cruzada con ConfiguracionSistema
    //                       (modo_entrega_password=AUTOMATICO) se valida en
    //                       runtime al enviar, no al arranque, porque el modo
    //                       puede alternar sin redeploy.
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    NOTIF_PURGA_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "NOTIF_PURGA_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 3 * * *"),
    // ---------------------------------------------------------------------
    // Cierre / fotografia (Slice 11 P11a — D-S11-A9, R-S11-11).
    //   CURSO_DEADLINE_CRON — expresion cron 5 campos para CursoDeadlineCron.
    //                         Hora del servidor (UTC por defecto). Default 08:00.
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    CURSO_DEADLINE_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "CURSO_DEADLINE_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 8 * * *"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    APP_BASE_URL: z.string().url().default("http://localhost:4000"),
    // ---------------------------------------------------------------------
    // Reportes estrategicos (Slice 11 P11c — D-S11-C2, D-S11-C4).
    //   REPORTE_CACHE_CRON  — recalculo nocturno top-N scopes (default 03:00).
    //   CONSULTAS_PURGA_CRON — retencion 90 dias en `consultas_logs`
    //                          (default 04:00, despues del cache cron).
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    REPORTE_CACHE_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "REPORTE_CACHE_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 3 * * *"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    CONSULTAS_PURGA_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "CONSULTAS_PURGA_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 4 * * *"),
    // ---------------------------------------------------------------------
    // Notificaciones residuales (Slice 11.5 P11.5c — D-S11.5-C1/C3/C6).
    //   RECORDATORIO_DEADLINE_CRON — recordatorio T+7 / T+1 a colaboradores
    //                                con asignacion activa (default 08:00).
    //   CENTRO_REVISION_CRON       — digest diario a admins con pendientes
    //                                en el Centro de revision (default 08:00).
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    RECORDATORIO_DEADLINE_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "RECORDATORIO_DEADLINE_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 8 * * *"),
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    CENTRO_REVISION_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "CENTRO_REVISION_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 8 * * *"),
    // ---------------------------------------------------------------------
    // Auditoria (Slice 12 P12 — D-S12-A4).
    //   PURGA_AUDITORIA_CRON — retencion 24 meses en `activity_logs`
    //                          (default 03:00 UTC; batched LIMIT 1000).
    // ---------------------------------------------------------------------
    // biome-ignore lint/style/useNamingConvention: nombre de variable de entorno (POSIX).
    PURGA_AUDITORIA_CRON: z
      .string()
      .regex(
        /^[*0-9\-,/\s]+$/,
        "PURGA_AUDITORIA_CRON debe ser una expresion cron con * 0-9 - , / o espacios",
      )
      .default("0 3 * * *"),
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
    if (!isAbsolute(data.STORAGE_ROOT)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STORAGE_ROOT"],
        message: `STORAGE_ROOT must be absolute in production (got: "${data.STORAGE_ROOT}")`,
      })
      return
    }
    const motivo = storageRootProhibidoEnProd(data.STORAGE_ROOT)
    if (motivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["STORAGE_ROOT"],
        message: `${motivo} (got: "${data.STORAGE_ROOT}")`,
      })
    }
  })
  .superRefine((data, ctx) => {
    // AI provider — el modo `claude` exige AI_API_KEY presente en cualquier
    // entorno (no solo prod). Falla al arranque si falta. (D-S8-B2)
    if (data.AI_PROVIDER === "claude" && (!data.AI_API_KEY || data.AI_API_KEY.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AI_API_KEY"],
        message: "AI_API_KEY es obligatoria cuando AI_PROVIDER=claude",
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
