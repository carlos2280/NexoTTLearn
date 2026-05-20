import type { ApiError } from "@/shared/api/api-error"
import type { AnularTransversalResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { anularIntentoTransversal } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface AnularVars {
  readonly intentoId: string
  readonly motivo: string
}

/**
 * Mutation admin para anular el intento transversal (E11). El motivo viaja en
 * header `X-Motivo` y queda auditado. La api genera la `Idempotency-Key`
 * internamente — un doble click no anula dos veces.
 */
export function useAnularIntentoTransversal(): UseMutationResult<
  AnularTransversalResponse,
  ApiError,
  AnularVars
> {
  const queryClient = useQueryClient()
  return useMutation<AnularTransversalResponse, ApiError, AnularVars>({
    mutationFn: (vars) => anularIntentoTransversal(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["transversal"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
