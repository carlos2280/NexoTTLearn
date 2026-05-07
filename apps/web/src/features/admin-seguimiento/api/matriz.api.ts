import { httpClient } from "@/shared/api/http-client"
import {
  type MatrizCursoResponse,
  type SeguimientoMatrizQuery,
  matrizCursoResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerMatrizSeguimiento(
  cursoId: string,
  query: Partial<SeguimientoMatrizQuery> = {},
): Promise<MatrizCursoResponse> {
  const search = new URLSearchParams()
  if (query.tab) {
    search.set("tab", query.tab)
  }
  if (query.estado) {
    search.set("estado", query.estado)
  }
  if (query.search) {
    search.set("search", query.search)
  }
  const qs = search.toString()
  const base = `/admin/cursos/${cursoId}/seguimiento/matriz`
  const path = qs ? `${base}?${qs}` : base
  const data = await httpClient.get<MatrizCursoResponse>(path)
  return matrizCursoResponseSchema.parse(data)
}
