import type { ApiError } from "@/shared/api/api-error"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { marcarNotificacionLeida, marcarTodasLeidas } from "../api/marcar-leida.api"
import { NOTIFICACIONES_BADGE_KEY } from "./use-notificaciones-badge"
import { NOTIFICACIONES_NO_LEIDAS_KEY } from "./use-notificaciones-no-leidas"

function invalidarNotificaciones(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_NO_LEIDAS_KEY })
  queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_BADGE_KEY })
}

export function useMarcarNotificacionLeida(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: marcarNotificacionLeida,
    onSuccess: () => invalidarNotificaciones(queryClient),
  })
}

export function useMarcarTodasLeidas(): UseMutationResult<void, ApiError, void> {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => invalidarNotificaciones(queryClient),
  })
}
