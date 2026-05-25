import { httpClient } from "@/shared/api/http-client"
import type {
  IntentoTransversalListadoItem,
  ListarIntentosTransversalCursoQuery,
  Paginated,
} from "@nexott-learn/shared-types"

/**
 * `GET /api/v1/cursos/:cursoId/intentos-transversal` (E6b, admin).
 * Listado paginado de intentos del proyecto transversal del curso. Alimenta
 * la tabla del subtab "Transversal" dentro del tab "Evaluaciones" de la
 * pantalla admin del curso. Cada item incluye `capasCargadas` (0-3) para
 * mostrar el progreso de evaluacion sin tener que abrir el detalle.
 */
export function listarIntentosTransversalPorCurso(input: {
  readonly cursoId: string
  readonly query: ListarIntentosTransversalCursoQuery
}): Promise<Paginated<IntentoTransversalListadoItem>> {
  const params = new URLSearchParams()
  params.set("page", String(input.query.page))
  params.set("pageSize", String(input.query.pageSize))
  if (input.query.estado) {
    params.set("estado", input.query.estado)
  }
  if (input.query.busqueda) {
    params.set("busqueda", input.query.busqueda)
  }
  const path = `/cursos/${input.cursoId}/intentos-transversal?${params.toString()}`
  return httpClient.get<Paginated<IntentoTransversalListadoItem>>(path)
}
