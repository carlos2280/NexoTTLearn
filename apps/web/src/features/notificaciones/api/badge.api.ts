import { httpClient } from "@/shared/api/http-client"
import type { NotificacionBadgeResponse } from "@nexott-learn/shared-types"

export function obtenerBadgeNotificaciones(): Promise<NotificacionBadgeResponse> {
  return httpClient.get<NotificacionBadgeResponse>("/notificaciones/badge")
}
