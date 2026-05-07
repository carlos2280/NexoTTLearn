import { httpClient } from "@/shared/api/http-client"
import {
  type CursoListResponse,
  type ListarCursosQuery,
  cursoListResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarCursos(
  query: Partial<ListarCursosQuery> = {},
): Promise<CursoListResponse> {
  const search = new URLSearchParams()
  if (query.q) {
    search.set("q", query.q)
  }
  if (query.estado) {
    search.set("estado", query.estado)
  }
  if (query.page !== undefined) {
    search.set("page", String(query.page))
  }
  if (query.pageSize !== undefined) {
    search.set("pageSize", String(query.pageSize))
  }
  const qs = search.toString()
  const path = qs ? `/admin/cursos?${qs}` : "/admin/cursos"
  const data = await httpClient.get<CursoListResponse>(path)
  return cursoListResponseSchema.parse(data)
}
