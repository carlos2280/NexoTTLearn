import type { ApiError } from "@/shared/api/api-error"
import type { NotificacionResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerNotificacion } from "../api/obtener-notificacion.api"

export const NOTIFICACION_DETALLE_KEY = ["notificaciones", "detalle"] as const

/**
 * Trae el detalle completo de una notificacion (incluido `payload`) para
 * componer el CTA por tipo desde `copy-notificacion`. Cacheado largo: el
 * payload es inmutable post-creacion.
 */
export function useObtenerNotificacion(
  notificacionId: string,
): UseQueryResult<NotificacionResponse, ApiError> {
  return useQuery<NotificacionResponse, ApiError>({
    queryKey: [...NOTIFICACION_DETALLE_KEY, notificacionId],
    queryFn: () => obtenerNotificacion(notificacionId),
    staleTime: 5 * 60_000,
  })
}
