import { httpClient } from "@/shared/api/http-client"
import type {
  ReutilizacionCatalogoQuery,
  ReutilizacionCatalogoResponse,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ReutilizacionCatalogoQuery): string {
  const params = new URLSearchParams()
  if (query.desde) {
    params.set("desde", query.desde.toISOString())
  }
  if (query.hasta) {
    params.set("hasta", query.hasta.toISOString())
  }
  params.set("format", query.format)
  return params.toString()
}

export function obtenerReutilizacionCatalogo(
  query: ReutilizacionCatalogoQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<ReutilizacionCatalogoResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<ReutilizacionCatalogoResponse>(
    `/reportes/reutilizacion-catalogo?${qs}`,
    options,
  )
}
