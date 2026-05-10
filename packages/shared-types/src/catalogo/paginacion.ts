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
