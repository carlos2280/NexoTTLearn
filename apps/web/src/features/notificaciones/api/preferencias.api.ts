import { httpClient } from "@/shared/api/http-client"
import type {
  PatchPreferenciasNotificacionInput,
  PreferenciasNotificacionResponse,
} from "@nexott-learn/shared-types"

export function obtenerPreferenciasNotificacion(): Promise<PreferenciasNotificacionResponse> {
  return httpClient.get<PreferenciasNotificacionResponse>("/notificaciones/preferencias")
}

export function actualizarPreferenciasNotificacion(
  input: PatchPreferenciasNotificacionInput,
): Promise<PreferenciasNotificacionResponse> {
  return httpClient.patch<PreferenciasNotificacionResponse>("/notificaciones/preferencias", input)
}
