import { httpClient } from "@/shared/api/http-client"
import {
  type EntregaBloqueListAdminResponse,
  type ListarEntregasBloqueAdminQuery,
  entregaBloqueListAdminResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarEntregasBloque(
  query: Partial<ListarEntregasBloqueAdminQuery> = {},
): Promise<EntregaBloqueListAdminResponse> {
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
  if (query.bloqueId) {
    search.set("bloqueId", query.bloqueId)
  }
  if (query.page !== undefined) {
    search.set("page", String(query.page))
  }
  if (query.pageSize !== undefined) {
    search.set("pageSize", String(query.pageSize))
  }
  const qs = search.toString()
  const path = qs
    ? `/admin/centro-revision/entregas-bloque?${qs}`
    : "/admin/centro-revision/entregas-bloque"
  const data = await httpClient.get<EntregaBloqueListAdminResponse>(path)
  return entregaBloqueListAdminResponseSchema.parse(data)
}
