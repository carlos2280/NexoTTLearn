import { httpClient } from "@/shared/api/http-client"
import type {
  EficaciaPlataformaQuery,
  EficaciaPlataformaResponse,
} from "@nexott-learn/shared-types"

function buildQueryString(query: EficaciaPlataformaQuery): string {
  const params = new URLSearchParams()
  if (query.desde) {
    params.set("desde", query.desde.toISOString())
  }
  if (query.hasta) {
    params.set("hasta", query.hasta.toISOString())
  }
  if (query.clienteId) {
    params.set("clienteId", query.clienteId)
  }
  params.set("format", query.format)
  return params.toString()
}

export function obtenerEficaciaPlataforma(
  query: EficaciaPlataformaQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<EficaciaPlataformaResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<EficaciaPlataformaResponse>(`/reportes/eficacia-plataforma?${qs}`, options)
}
