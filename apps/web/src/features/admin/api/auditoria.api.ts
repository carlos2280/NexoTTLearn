import { httpClient } from "@/shared/api/http-client"
import type { AuditoriaResumen, ListarAuditoriaQuery, Paginated } from "@nexott-learn/shared-types"

function buildQueryString(query: ListarAuditoriaQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.actorUsuarioId) {
    params.set("actorUsuarioId", query.actorUsuarioId)
  }
  if (query.recursoTipo) {
    params.set("recursoTipo", query.recursoTipo)
  }
  if (query.recursoId) {
    params.set("recursoId", query.recursoId)
  }
  if (query.accion) {
    params.set("accion", query.accion)
  }
  if (query.desde) {
    params.set("desde", query.desde)
  }
  if (query.hasta) {
    params.set("hasta", query.hasta)
  }
  if (query.exito !== undefined) {
    params.set("exito", String(query.exito))
  }
  return params.toString()
}

export function listarAuditoria(
  query: ListarAuditoriaQuery,
  options?: { readonly signal?: AbortSignal },
): Promise<Paginated<AuditoriaResumen>> {
  const qs = buildQueryString(query)
  return httpClient.get<Paginated<AuditoriaResumen>>(`/admin/auditoria?${qs}`, options)
}
