import { httpClient } from "@/shared/api/http-client"
import type { CentroRevisionQuery, CentroRevisionResponse } from "@nexott-learn/shared-types"

function buildQueryString(query: CentroRevisionQuery): string {
  const params = new URLSearchParams()
  if (query.cursoId) {
    params.set("cursoId", query.cursoId)
  }
  params.set("tipo", query.tipo)
  params.set("vista", query.vista)
  params.set("format", query.format)
  return params.toString()
}

export function obtenerCentroRevision(
  query: CentroRevisionQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<CentroRevisionResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<CentroRevisionResponse>(`/reportes/centro-revision?${qs}`, options)
}
