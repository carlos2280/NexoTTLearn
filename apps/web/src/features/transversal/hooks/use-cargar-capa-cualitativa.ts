import type { ApiError } from "@/shared/api/api-error"
import type {
  CargarCapaCualitativaInput,
  IntentoTransversalAdminResponse,
} from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { cargarCapaCualitativa } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface CargarCapaCualitativaVars {
  readonly intentoId: string
  readonly body: CargarCapaCualitativaInput
}

/**
 * Mutation admin para cargar la capa cualitativa (E8). Comentario + confianza
 * + nota. Tras exito invalida el detalle del intento y listas dependientes.
 */
export function useCargarCapaCualitativa(): UseMutationResult<
  IntentoTransversalAdminResponse,
  ApiError,
  CargarCapaCualitativaVars
> {
  const queryClient = useQueryClient()
  return useMutation<IntentoTransversalAdminResponse, ApiError, CargarCapaCualitativaVars>({
    mutationFn: (vars) => cargarCapaCualitativa(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["transversal"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
