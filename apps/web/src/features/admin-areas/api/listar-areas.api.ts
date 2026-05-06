import { httpClient } from "@/shared/api/http-client"
import {
  type AreaListResponse,
  type ListarAreasQuery,
  areaListResponseSchema,
} from "@nexott-learn/shared-types"

/**
 * Lista paginada del catálogo de áreas. Validamos el response con Zod para
 * blindar el adapter frente a desincronización del contrato.
 */
export async function listarAreas(
  query: Partial<ListarAreasQuery> = {},
): Promise<AreaListResponse> {
  const search = new URLSearchParams()
  if (query.estado) {
    search.set("estado", query.estado)
  }
  if (query.q) {
    search.set("q", query.q)
  }
  if (query.page !== undefined) {
    search.set("page", String(query.page))
  }
  if (query.pageSize !== undefined) {
    search.set("pageSize", String(query.pageSize))
  }
  const qs = search.toString()
  const path = qs ? `/admin/areas?${qs}` : "/admin/areas"
  const data = await httpClient.get<AreaListResponse>(path)
  return areaListResponseSchema.parse(data)
}
