import { httpClient } from "@/shared/api/http-client"
import type { CoberturaAreasQuery, CoberturaAreasResponse } from "@nexott-learn/shared-types"

export function obtenerCoberturaAreas(
  query: CoberturaAreasQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<CoberturaAreasResponse> {
  const params = new URLSearchParams()
  if (query.clienteId) {
    params.set("clienteId", query.clienteId)
  }
  const qs = params.toString()
  return httpClient.get<CoberturaAreasResponse>(
    qs ? `/reportes/cobertura-areas?${qs}` : "/reportes/cobertura-areas",
    options,
  )
}
