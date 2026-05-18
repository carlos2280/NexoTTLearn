import type { ApiError } from "@/shared/api/api-error"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { archivarNotificacion } from "../api/archivar-notificacion.api"
import { NOTIFICACIONES_KEY } from "./use-notificaciones"
import { NOTIFICACIONES_BADGE_KEY } from "./use-notificaciones-badge"
import { NOTIFICACIONES_NO_LEIDAS_KEY } from "./use-notificaciones-no-leidas"

export function useArchivarNotificacion(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, string>({
    mutationFn: archivarNotificacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_BADGE_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_NO_LEIDAS_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICACIONES_KEY })
    },
  })
}
