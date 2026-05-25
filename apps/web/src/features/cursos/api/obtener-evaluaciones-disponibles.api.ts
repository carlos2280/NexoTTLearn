import { httpClient } from "@/shared/api/http-client"
import type { EvaluacionesDisponibles } from "@nexott-learn/shared-types"

export function obtenerEvaluacionesDisponibles(cursoId: string): Promise<EvaluacionesDisponibles> {
  return httpClient.get<EvaluacionesDisponibles>(`/cursos/${cursoId}/evaluaciones-disponibles`)
}
