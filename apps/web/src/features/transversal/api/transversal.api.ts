import { httpClient } from "@/shared/api/http-client"
import type { TransversalResponse } from "@nexott-learn/shared-types"

/**
 * `GET /api/v1/cursos/:cursoId/transversal` — definicion del transversal del
 * curso (D86). En cliente solo consumimos `descripcion` + `capasActivas`;
 * `pesosCapas`, `umbralAprobacion` y `skillsQueMide` son maquinaria interna
 * que ocultamos al participante (decision 2026-05-15 spec 05).
 */
export function obtenerTransversalCurso(cursoId: string): Promise<TransversalResponse> {
  return httpClient.get<TransversalResponse>(`/cursos/${cursoId}/transversal`)
}
