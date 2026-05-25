import { httpClient } from "@/shared/api/http-client"
import type { DisponibilidadTransversalResponse } from "@nexott-learn/shared-types"

export function obtenerDisponibilidadTransversal(
  asignacionId: string,
): Promise<DisponibilidadTransversalResponse> {
  return httpClient.get<DisponibilidadTransversalResponse>(
    `/asignaciones/${asignacionId}/transversal/disponibilidad`,
  )
}
