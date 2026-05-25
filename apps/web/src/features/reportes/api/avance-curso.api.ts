import { httpClient } from "@/shared/api/http-client"
import type {
  AvanceCursoQuery,
  EventoHistorico,
  FilaAvanceCurso,
  Paginated,
} from "@nexott-learn/shared-types"

export type AvanceCursoResponse = Paginated<FilaAvanceCurso> | Paginated<EventoHistorico>

function buildQueryString(query: AvanceCursoQuery): string {
  const params = new URLSearchParams()
  params.set("cursoId", query.cursoId)
  params.set("vista", query.vista)
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.sort) {
    params.set("sort", query.sort)
  }
  params.set("format", query.format)
  return params.toString()
}

export function obtenerAvanceCurso(
  query: AvanceCursoQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<AvanceCursoResponse> {
  const qs = buildQueryString(query)
  return httpClient.get<AvanceCursoResponse>(`/reportes/avance-curso?${qs}`, options)
}
