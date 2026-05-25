import type { ApiError } from "@/shared/api/api-error"
import type {
  PatchPreferenciasNotificacionInput,
  PreferenciasNotificacionResponse,
} from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarPreferenciasNotificacion } from "../api/preferencias.api"
import { PREFERENCIAS_NOTIFICACION_KEY } from "./use-preferencias-notificacion"

export function useActualizarPreferenciasNotificacion(): UseMutationResult<
  PreferenciasNotificacionResponse,
  ApiError,
  PatchPreferenciasNotificacionInput
> {
  const queryClient = useQueryClient()
  return useMutation<
    PreferenciasNotificacionResponse,
    ApiError,
    PatchPreferenciasNotificacionInput
  >({
    mutationFn: actualizarPreferenciasNotificacion,
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCIAS_NOTIFICACION_KEY, data)
    },
  })
}
