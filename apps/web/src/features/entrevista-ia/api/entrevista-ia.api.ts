import { httpClient } from "@/shared/api/http-client"
import type { EntrevistaIaResponse } from "@nexott-learn/shared-types"

/**
 * `GET /api/v1/cursos/:cursoId/entrevista-ia` — definicion de la entrevista
 * (D89). En cliente solo consumimos `duracionMinutos`; el resto
 * (`umbralAprobacion`, `filosofia`, `profundidad`, `tono`, `areas`) es
 * maquinaria interna que ocultamos al participante (decision 2026-05-15
 * spec 06).
 */
export function obtenerEntrevistaIaCurso(cursoId: string): Promise<EntrevistaIaResponse> {
  return httpClient.get<EntrevistaIaResponse>(`/cursos/${cursoId}/entrevista-ia`)
}
