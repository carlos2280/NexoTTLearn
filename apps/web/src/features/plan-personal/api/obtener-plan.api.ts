import { httpClient } from "@/shared/api/http-client"
import type { PlanResponseParticipante } from "@nexott-learn/shared-types"

/**
 * En endpoints `@Roles(ADMIN, PARTICIPANTE)` el backend decide la forma de
 * respuesta según la sesión. Para usuarios PARTICIPANTE devuelve
 * `PlanResponseParticipante` (sin `fichaSnapshot`, sin `razon` por item).
 */
export function obtenerPlanParticipante(asignacionId: string): Promise<PlanResponseParticipante> {
  return httpClient.get<PlanResponseParticipante>(`/asignaciones/${asignacionId}/plan`)
}
