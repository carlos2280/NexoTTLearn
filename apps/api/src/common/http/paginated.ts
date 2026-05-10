/**
 * Forma canonica de respuesta paginada del API (convenciones API §7).
 * Toda lista debe usar este wrapper para mantener la firma estable
 * entre dominios.
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

/**
 * Resuelve los parametros de paginacion ya validados por Zod en `{ skip, take,
 * page, pageSize }`. Centraliza la conversion para que ningun service tenga
 * que calcular `skip` inline. El clamp de page/pageSize lo aplica el schema
 * Zod (`paginacionQuerySchema`); aqui solo deriva offset/limit.
 */
export function resolvePaginacion(query: {
  readonly page: number
  readonly pageSize: number
}): {
  readonly page: number
  readonly pageSize: number
  readonly skip: number
  readonly take: number
} {
  return {
    page: query.page,
    pageSize: query.pageSize,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  } as const
}

/**
 * Construye una respuesta paginada. El clamp de pageSize ya lo aplica el
 * schema Zod de entrada (`paginacionQuerySchema`), por lo que aqui solo se
 * arma el meta.
 */
export function buildPaginatedResponse<T>(
  data: readonly T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  }
}
