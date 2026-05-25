import type { ApiError } from "@/shared/api/api-error"
import type {
  CargarCapaTestsInput,
  IntentoTransversalAdminResponse,
} from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { cargarCapaTests } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface CargarCapaTestsVars {
  readonly intentoId: string
  readonly body: CargarCapaTestsInput
}

/**
 * Mutation admin para cargar la capa de tests automatizados (E7). Tras exito
 * invalida la query del intento (refresca la vista) y las ramas dependientes
 * (listado por curso, ficha del colaborador).
 */
export function useCargarCapaTests(): UseMutationResult<
  IntentoTransversalAdminResponse,
  ApiError,
  CargarCapaTestsVars
> {
  const queryClient = useQueryClient()
  return useMutation<IntentoTransversalAdminResponse, ApiError, CargarCapaTestsVars>({
    mutationFn: (vars) => cargarCapaTests(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
      queryClient.invalidateQueries({ queryKey: ["transversal"] })
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] })
    },
  })
}
