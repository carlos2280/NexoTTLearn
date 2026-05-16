import { httpClient } from "@/shared/api/http-client"
import type { HistoricoClienteQuery, HistoricoClienteResponse } from "@nexott-learn/shared-types"

function buildQueryString(query: HistoricoClienteQuery): string {
  const params = new URLSearchParams()
  params.set("clienteId", query.clienteId)
  if (query.desde) {
    params.set("desde", query.desde.toISOString())
  }
  if (query.hasta) {
    params.set("hasta", query.hasta.toISOString())
  }
  params.set("format", query.format)
  return params.toString()
}

export function obtenerHistoricoCliente(
  query: HistoricoClienteQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<HistoricoClienteResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<HistoricoClienteResponse>(`/reportes/historico-cliente?${qs}`, options)
}
