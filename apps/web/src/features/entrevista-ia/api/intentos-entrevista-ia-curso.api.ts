import { httpClient } from "@/shared/api/http-client"
import type {
  IntentoEntrevistaIaListadoItem,
  ListarIntentosEntrevistaIaCursoQuery,
  Paginated,
} from "@nexott-learn/shared-types"

/**
 * `GET /api/v1/cursos/:cursoId/intentos-entrevista-ia` (E21, admin).
 * Listado paginado de intentos de Entrevista IA del curso. Alimenta la tabla
 * del subtab "Entrevista IA" dentro del tab "Evaluaciones" de la pantalla
 * admin del curso. Devuelve un shape ligero — el detalle del intento se
 * obtiene aparte al abrir un item.
 */
export function listarIntentosEntrevistaIaPorCurso(input: {
  readonly cursoId: string
  readonly query: ListarIntentosEntrevistaIaCursoQuery
}): Promise<Paginated<IntentoEntrevistaIaListadoItem>> {
  const params = new URLSearchParams()
  params.set("page", String(input.query.page))
  params.set("pageSize", String(input.query.pageSize))
  if (input.query.estado) {
    params.set("estado", input.query.estado)
  }
  if (input.query.busqueda) {
    params.set("busqueda", input.query.busqueda)
  }
  const path = `/cursos/${input.cursoId}/intentos-entrevista-ia?${params.toString()}`
  return httpClient.get<Paginated<IntentoEntrevistaIaListadoItem>>(path)
}
