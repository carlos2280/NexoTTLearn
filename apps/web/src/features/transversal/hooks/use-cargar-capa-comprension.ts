import type { ApiError } from "@/shared/api/api-error"
import type {
  CargarCapaComprensionInput,
  IntentoTransversalAdminResponse,
} from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { cargarCapaComprension } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface CargarCapaComprensionVars {
  readonly intentoId: string
  readonly body: CargarCapaComprensionInput
}

/**
 * Mutation admin para cargar la capa de comprension (E9). Nota + transcripcion
 * de la mini-entrevista. Tras exito invalida detalle del intento + listas.
 */
export function useCargarCapaComprension(): UseMutationResult<
  IntentoTransversalAdminResponse,
  ApiError,
  CargarCapaComprensionVars
> {
  const queryClient = useQueryClient()
  return useMutation<IntentoTransversalAdminResponse, ApiError, CargarCapaComprensionVars>({
    mutationFn: (vars) => cargarCapaComprension(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["transversal"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
