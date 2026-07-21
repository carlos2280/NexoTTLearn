import type { ApiError } from "@/shared/api/api-error"
import type {
  CurarReporteFinalInput,
  IntentoTransversalAdminResponse,
} from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { curarReporteFinal } from "../api/intentos-transversal.api"
import { INTENTO_TRANSVERSAL_ADMIN_KEY } from "./use-obtener-intento-transversal-admin"

interface CurarReporteFinalVars {
  readonly intentoId: string
  readonly body: CurarReporteFinalInput
}

/**
 * Mutation admin para curar el informe del participante (E13, B3): resumen +
 * áreas a reforzar. Tras éxito invalida el detalle del intento para repintar el
 * informe curado. Solo procede mientras el intento está EVALUADO (lo valida el
 * backend; el editor deshabilita fuera de ese estado).
 */
export function useCurarReporteFinal(): UseMutationResult<
  IntentoTransversalAdminResponse,
  ApiError,
  CurarReporteFinalVars
> {
  const queryClient = useQueryClient()
  return useMutation<IntentoTransversalAdminResponse, ApiError, CurarReporteFinalVars>({
    mutationFn: (vars) => curarReporteFinal(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTENTO_TRANSVERSAL_ADMIN_KEY })
    },
  })
}
