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

const PAGE_SIZE_MAXIMO = 100

/**
 * Construye una respuesta paginada aplicando el clamping silencioso
 * de pageSize segun convenciones API §7 (max 100).
 */
export function buildPaginatedResponse<T>(
  data: readonly T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  const pageSizeEfectivo = Math.min(Math.max(pageSize, 1), PAGE_SIZE_MAXIMO)
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSizeEfectivo)
  return {
    data,
    meta: {
      page,
      pageSize: pageSizeEfectivo,
      total,
      totalPages,
    },
  }
}
