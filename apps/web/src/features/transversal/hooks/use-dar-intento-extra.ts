import type { ApiError } from "@/shared/api/api-error"
import type { DarIntentoExtraTransversalResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { darIntentoExtraTransversal } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface DarIntentoExtraVars {
  readonly asignacionId: string
}

/**
 * Mutation admin para otorgar +1 intento del transversal (E12, Fase 4b ②).
 * Tras éxito invalida el detalle del intento para que el bloque "Intentos"
 * refleje el cupo nuevo.
 */
export function useDarIntentoExtra(): UseMutationResult<
  DarIntentoExtraTransversalResponse,
  ApiError,
  DarIntentoExtraVars
> {
  const queryClient = useQueryClient()
  return useMutation<DarIntentoExtraTransversalResponse, ApiError, DarIntentoExtraVars>({
    mutationFn: (vars) => darIntentoExtraTransversal(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
    },
  })
}
