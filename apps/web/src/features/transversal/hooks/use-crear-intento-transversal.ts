import type { ApiError } from "@/shared/api/api-error"
import type {
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
} from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { crearIntentoTransversal } from "../api/intentos-transversal.api"
import { CUPO_TRANSVERSAL_KEY } from "./use-cupo-transversal"
import { INTENTOS_TRANSVERSAL_KEY } from "./use-listar-intentos-transversal"

interface CrearIntentoTransversalArgs {
  readonly asignacionId: string
  readonly body: CrearIntentoTransversalInput
}

export function useCrearIntentoTransversal(): UseMutationResult<
  CrearIntentoTransversalResponse,
  ApiError,
  CrearIntentoTransversalArgs
> {
  const queryClient = useQueryClient()
  return useMutation<CrearIntentoTransversalResponse, ApiError, CrearIntentoTransversalArgs>({
    mutationFn: crearIntentoTransversal,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: [...INTENTOS_TRANSVERSAL_KEY, vars.asignacionId],
      })
      // El nuevo intento consume cupo: refrescar el "N de M" del hito (B1).
      queryClient.invalidateQueries({
        queryKey: [...CUPO_TRANSVERSAL_KEY, vars.asignacionId],
      })
    },
  })
}
