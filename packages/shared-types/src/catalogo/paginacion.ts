import { z } from "zod"

/**
 * Esquema base de paginacion para los listados del catalogo (convenciones API §7).
 * Defaults: page=1, pageSize=20. El backend aplica clamp silencioso de pageSize
 * a [1, 100] via `buildPaginatedResponse`.
 */
export const paginacionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginacionQuery = z.infer<typeof paginacionQuerySchema>

/**
 * Schema reutilizable para parsear flags booleanos en query params HTTP.
 * Centraliza el patron ad-hoc duplicado en varios controllers (cierre §5.98
 * — FIX-P7-cierre).
 *
 * Acepta:
 *  - `boolean` nativo (cuando el caller ya parseo el query).
 *  - `"true"` / `"false"` (case-sensitive — el frontend manda strings).
 *  - ausente → resuelve al `defaultValue` (si se pasa) o `false`.
 *
 * Uso:
 *   incluirInvalidados: booleanQuerySchema(),       // default false
 *   incluirOpcionales : booleanQuerySchema(true),   // default true
 */
export const booleanQuerySchema = (
  defaultValue = false,
): z.ZodEffects<
  z.ZodDefault<z.ZodUnion<[z.ZodBoolean, z.ZodLiteral<"true">, z.ZodLiteral<"false">]>>,
  boolean,
  boolean | "true" | "false" | undefined
> =>
  z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .default(defaultValue)
    .transform((v) => v === true || v === "true")

/**
 * Forma canonica de respuesta paginada del API (convenciones API §7).
 * Replica de `apps/api/src/common/http/paginated.ts` para que el frontend
 * pueda tipar las respuestas sin depender del backend.
 */
export interface Paginated<T> {
  readonly data: readonly T[]
  readonly meta: {
    readonly page: number
    readonly pageSize: number
    readonly total: number
    readonly totalPages: number
  }
}
