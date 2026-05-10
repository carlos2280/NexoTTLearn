import { httpClient } from "@/shared/api/http-client"
import {
  type AreaListResponse,
  type ListarAreasQuery,
  areaListResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarAreasCatalogo(
  query: Partial<ListarAreasQuery> = {},
): Promise<AreaListResponse> {
  const params = new URLSearchParams()
  if (query.q) {
    params.set("q", query.q)
  }
  if (query.estado) {
    params.set("estado", query.estado)
  }
  if (query.page) {
    params.set("page", String(query.page))
  }
  if (query.pageSize) {
    params.set("pageSize", String(query.pageSize))
  }
  const qs = params.toString()
  const data = await httpClient.get<AreaListResponse>(`/admin/areas${qs ? `?${qs}` : ""}`)
  return areaListResponseSchema.parse(data)
}
