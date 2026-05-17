import type { ApiError } from "@/shared/api/api-error"
import type { NotificacionResumen, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarNotificaciones } from "../api/listar-notificaciones.api"

export const NOTIFICACIONES_KEY = ["notificaciones", "centro"] as const

export type FiltroCentro = "todas" | "no-leidas" | "archivadas"

interface UseNotificacionesParams {
  readonly filtro: FiltroCentro
  readonly pageSize?: number
}

/**
 * Query del centro de notificaciones (`/notificaciones`). Mapea el tab UI a
 * los parametros del endpoint:
 *  - "todas" → `archivada=false` (oculta archivadas — comportamiento default).
 *  - "no-leidas" → `archivada=false` + `leida=false`.
 *  - "archivadas" → `archivada=true`.
 */
export function useNotificaciones({
  filtro,
  pageSize = 50,
}: UseNotificacionesParams): UseQueryResult<Paginated<NotificacionResumen>, ApiError> {
  return useQuery<Paginated<NotificacionResumen>, ApiError>({
    queryKey: [...NOTIFICACIONES_KEY, filtro, pageSize],
    queryFn: () =>
      listarNotificaciones({
        archivada: filtro === "archivadas",
        leida: filtro === "no-leidas" ? false : undefined,
        pageSize,
        sort: "-fechaCreacion",
      }),
    staleTime: 30_000,
  })
}
