import { httpClient } from "@/shared/api/http-client"
import type { InventarioSkillsQuery, InventarioSkillsResponse } from "@nexott-learn/shared-types"

function buildQueryString(query: InventarioSkillsQuery): string {
  const params = new URLSearchParams()
  if (query.areaId) {
    params.set("areaId", query.areaId)
  }
  if (query.skillIds && query.skillIds.length > 0) {
    params.set("skillIds", query.skillIds.join(","))
  }
  params.set("umbralCumple", String(query.umbralCumple))
  params.set("format", query.format)
  return params.toString()
}

export function obtenerInventarioSkills(
  query: InventarioSkillsQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<InventarioSkillsResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<InventarioSkillsResponse>(`/reportes/inventario-skills?${qs}`, options)
}
