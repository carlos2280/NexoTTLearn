import type { ApiError } from "@/shared/api/api-error"
import type { NotificacionResumen, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarNotificaciones } from "../api/listar-notificaciones.api"

export const NOTIFICACIONES_NO_LEIDAS_KEY = ["notificaciones", "no-leidas"] as const

export function useNotificacionesNoLeidas(
  limite = 5,
): UseQueryResult<Paginated<NotificacionResumen>, ApiError> {
  return useQuery<Paginated<NotificacionResumen>, ApiError>({
    queryKey: [...NOTIFICACIONES_NO_LEIDAS_KEY, limite],
    queryFn: () =>
      listarNotificaciones({
        leida: false,
        archivada: false,
        pageSize: limite,
        sort: "-fechaCreacion",
      }),
    staleTime: 30_000,
  })
}
