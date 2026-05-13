import { httpClient } from "@/shared/api/http-client"

export function marcarNotificacionLeida(notificacionId: string): Promise<void> {
  return httpClient.post<void>(`/notificaciones/${notificacionId}/marcar-leida`)
}

export function marcarTodasLeidas(): Promise<void> {
  return httpClient.post<void>("/notificaciones/marcar-todas-leidas")
}
