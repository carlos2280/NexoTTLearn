import type { ApiError } from "@/shared/api/api-error"
import type { TransversalResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerTransversalCurso } from "../api/transversal.api"

export const TRANSVERSAL_CURSO_KEY = ["transversal", "curso"] as const

export function useTransversalCurso(
  cursoId: string | null,
): UseQueryResult<TransversalResponse, ApiError> {
  return useQuery<TransversalResponse, ApiError>({
    queryKey: [...TRANSVERSAL_CURSO_KEY, cursoId ?? ""],
    queryFn: () => obtenerTransversalCurso(cursoId as string),
    staleTime: 5 * 60_000,
    enabled: !!cursoId,
  })
}
