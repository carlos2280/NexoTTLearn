import { httpClient } from "@/shared/api/http-client"

/**
 * `POST /notificaciones/:notificacionId/archivar` (E6). Archivar saca a la
 * notificacion del listado por defecto (`archivada=false`); el tab
 * "Archivadas" del centro la sigue mostrando.
 */
export function archivarNotificacion(notificacionId: string): Promise<void> {
  return httpClient.post<void>(`/notificaciones/${notificacionId}/archivar`)
}
