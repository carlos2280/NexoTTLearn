import { httpClient } from "@/shared/api/http-client"
import type { NotificacionResponse } from "@nexott-learn/shared-types"

/**
 * `GET /notificaciones/:notificacionId` (E3). Detalle completo con `payload`
 * — necesario para componer el CTA real por tipo (`copy-notificacion`).
 */
export function obtenerNotificacion(notificacionId: string): Promise<NotificacionResponse> {
  return httpClient.get<NotificacionResponse>(`/notificaciones/${notificacionId}`)
}
