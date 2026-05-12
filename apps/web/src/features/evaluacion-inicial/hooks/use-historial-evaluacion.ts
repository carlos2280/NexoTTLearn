import type { CargaEvaluacionInicialResumen, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarHistorial } from "../api/evaluacion-inicial.api"

export const HISTORIAL_EVALUACION_KEY = ["evaluacion-inicial", "historial"] as const

export function useHistorialEvaluacion(
  cursoId: string,
  page: number,
  pageSize = 10,
  habilitado = true,
): UseQueryResult<Paginated<CargaEvaluacionInicialResumen>, Error> {
  return useQuery({
    queryKey: [...HISTORIAL_EVALUACION_KEY, cursoId, page, pageSize] as const,
    queryFn: () => listarHistorial(cursoId, { page, pageSize }),
    enabled: habilitado && cursoId.length > 0,
    staleTime: 30_000,
  })
}
