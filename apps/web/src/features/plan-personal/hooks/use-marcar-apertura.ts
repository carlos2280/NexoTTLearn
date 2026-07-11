import { marcarAperturaSeccion } from "@/features/plan-personal/api/marcar-apertura.api"
import type { ApiError } from "@/shared/api/api-error"
import type { AperturaSeccionResponse } from "@nexott-learn/shared-types"
import { type UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query"
import { invalidarQueriesTrasApertura } from "./invalidar-tras-apertura"

interface MarcarAperturaInput {
  readonly asignacionId: string
  readonly seccionId: string
}

/**
 * Mutación de "marcar sección abierta" (D94). Al éxito invalida las queries
 * de plan y avance del curso para que el porcentaje y el check verde del
 * sidebar se actualicen si la sección era de lectura pura (sin bloques
 * evaluables).
 */
export function useMarcarApertura(): UseMutationResult<
  AperturaSeccionResponse,
  ApiError,
  MarcarAperturaInput
> {
  const queryClient = useQueryClient()
  return useMutation<AperturaSeccionResponse, ApiError, MarcarAperturaInput>({
    mutationFn: marcarAperturaSeccion,
    onSuccess: () => invalidarQueriesTrasApertura(queryClient),
  })
}
