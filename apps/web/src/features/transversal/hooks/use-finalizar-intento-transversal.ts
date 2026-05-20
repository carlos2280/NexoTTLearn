import type { ApiError } from "@/shared/api/api-error"
import type { FinalizarTransversalResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { finalizarIntentoTransversal } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface FinalizarVars {
  readonly intentoId: string
}

/**
 * Mutation admin para finalizar el intento transversal (E10). Calcula la nota
 * global desde las 3 capas y actualiza las skills del colaborador. Tras exito
 * invalida el detalle del intento + ramas dependientes.
 */
export function useFinalizarIntentoTransversal(): UseMutationResult<
  FinalizarTransversalResponse,
  ApiError,
  FinalizarVars
> {
  const queryClient = useQueryClient()
  return useMutation<FinalizarTransversalResponse, ApiError, FinalizarVars>({
    mutationFn: (vars) => finalizarIntentoTransversal(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["transversal"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
