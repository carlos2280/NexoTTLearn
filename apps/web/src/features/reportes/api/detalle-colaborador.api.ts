import { httpClient } from "@/shared/api/http-client"
import type {
  DetalleColaboradorQuery,
  DetalleColaboradorResponse,
} from "@nexott-learn/shared-types"

function buildQueryString(query: DetalleColaboradorQuery): string {
  const params = new URLSearchParams()
  params.set("cursoId", query.cursoId)
  params.set("colaboradorId", query.colaboradorId)
  params.set("vista", query.vista)
  params.set("format", query.format)
  return params.toString()
}

export function obtenerDetalleColaborador(
  query: DetalleColaboradorQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<DetalleColaboradorResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<DetalleColaboradorResponse>(`/reportes/detalle-colaborador?${qs}`, options)
}
