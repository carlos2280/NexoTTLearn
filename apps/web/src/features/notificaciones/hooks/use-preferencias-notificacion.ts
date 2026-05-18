import type { ApiError } from "@/shared/api/api-error"
import type { PreferenciasNotificacionResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerPreferenciasNotificacion } from "../api/preferencias.api"

export const PREFERENCIAS_NOTIFICACION_KEY = ["notificaciones", "preferencias"] as const

export function usePreferenciasNotificacion(): UseQueryResult<
  PreferenciasNotificacionResponse,
  ApiError
> {
  return useQuery<PreferenciasNotificacionResponse, ApiError>({
    queryKey: PREFERENCIAS_NOTIFICACION_KEY,
    queryFn: obtenerPreferenciasNotificacion,
    staleTime: 5 * 60_000,
  })
}
