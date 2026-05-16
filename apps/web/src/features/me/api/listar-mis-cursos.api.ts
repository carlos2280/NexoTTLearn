import { httpClient } from "@/shared/api/http-client"
import type { MeCursoResumen, MeCursosQuery, Paginated } from "@nexott-learn/shared-types"

export function listarMisCursos(
  filtros?: Partial<MeCursosQuery>,
): Promise<Paginated<MeCursoResumen>> {
  const params = new URLSearchParams()
  if (filtros?.page !== undefined) {
    params.set("page", String(filtros.page))
  }
  if (filtros?.pageSize !== undefined) {
    params.set("pageSize", String(filtros.pageSize))
  }
  if (filtros?.estado !== undefined) {
    params.set("estado", filtros.estado)
  }
  if (filtros?.rol !== undefined) {
    params.set("rol", filtros.rol)
  }
  const qs = params.toString()
  return httpClient.get<Paginated<MeCursoResumen>>(`/me/cursos${qs ? `?${qs}` : ""}`)
}
