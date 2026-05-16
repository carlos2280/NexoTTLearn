import { httpClient } from "@/shared/api/http-client"
import type { BrechasDetectadasQuery, BrechasDetectadasResponse } from "@nexott-learn/shared-types"

function buildQueryString(query: BrechasDetectadasQuery): string {
  const params = new URLSearchParams()
  params.set("cursoId", query.cursoId)
  params.set("vista", query.vista)
  params.set("format", query.format)
  return params.toString()
}

export function obtenerBrechasDetectadas(
  query: BrechasDetectadasQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<BrechasDetectadasResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<BrechasDetectadasResponse>(`/reportes/brechas-detectadas?${qs}`, options)
}
