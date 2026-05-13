import type { ApiError } from "@/shared/api/api-error"
import type { NotificacionBadgeResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerBadgeNotificaciones } from "../api/badge.api"

export const NOTIFICACIONES_BADGE_KEY = ["notificaciones", "badge"] as const

const REFETCH_BADGE_MS = 60_000

export function useNotificacionesBadge(): UseQueryResult<NotificacionBadgeResponse, ApiError> {
  return useQuery<NotificacionBadgeResponse, ApiError>({
    queryKey: NOTIFICACIONES_BADGE_KEY,
    queryFn: obtenerBadgeNotificaciones,
    staleTime: REFETCH_BADGE_MS / 2,
    refetchInterval: REFETCH_BADGE_MS,
    refetchIntervalInBackground: false,
  })
}
