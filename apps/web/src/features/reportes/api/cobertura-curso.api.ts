import { httpClient } from "@/shared/api/http-client"
import type { CoberturaCursoQuery, CoberturaCursoResponse } from "@nexott-learn/shared-types"

export function obtenerCoberturaCurso(
  query: CoberturaCursoQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<CoberturaCursoResponse> {
  const params = new URLSearchParams()
  params.set("cursoId", query.cursoId)
  return httpClient.get<CoberturaCursoResponse>(
    `/reportes/cobertura-curso?${params.toString()}`,
    options,
  )
}
