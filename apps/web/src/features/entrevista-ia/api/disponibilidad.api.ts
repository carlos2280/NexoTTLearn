import { httpClient } from "@/shared/api/http-client"
import type { DisponibilidadEntrevistaIaResponse } from "@nexott-learn/shared-types"

export function obtenerDisponibilidadEntrevistaIa(
  asignacionId: string,
): Promise<DisponibilidadEntrevistaIaResponse> {
  return httpClient.get<DisponibilidadEntrevistaIaResponse>(
    `/asignaciones/${asignacionId}/entrevista-ia/disponibilidad`,
  )
}
