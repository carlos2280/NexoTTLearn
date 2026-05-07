import { httpClient } from "@/shared/api/http-client"
import {
  type EntregaProyectoListAdminResponse,
  type ListarEntregasProyectoAdminQuery,
  entregaProyectoListAdminResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarEntregasProyecto(
  query: Partial<ListarEntregasProyectoAdminQuery> = {},
): Promise<EntregaProyectoListAdminResponse> {
  const search = new URLSearchParams()
  if (query.estado) {
    search.set("estado", query.estado)
  }
  if (query.cursoId) {
    search.set("cursoId", query.cursoId)
  }
  if (query.moduloId) {
    search.set("moduloId", query.moduloId)
  }
  if (query.participanteId) {
    search.set("participanteId", query.participanteId)
  }
  if (query.miniProyectoId) {
    search.set("miniProyectoId", query.miniProyectoId)
  }
  if (query.transversalId) {
    search.set("transversalId", query.transversalId)
  }
  if (query.tipo) {
    search.set("tipo", query.tipo)
  }
  if (query.page !== undefined) {
    search.set("page", String(query.page))
  }
  if (query.pageSize !== undefined) {
    search.set("pageSize", String(query.pageSize))
  }
  const qs = search.toString()
  const path = qs
    ? `/admin/centro-revision/entregas-proyecto?${qs}`
    : "/admin/centro-revision/entregas-proyecto"
  const data = await httpClient.get<EntregaProyectoListAdminResponse>(path)
  return entregaProyectoListAdminResponseSchema.parse(data)
}
