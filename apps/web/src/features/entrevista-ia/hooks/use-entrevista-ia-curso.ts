import type { ApiError } from "@/shared/api/api-error"
import type { EntrevistaIaResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerEntrevistaIaCurso } from "../api/entrevista-ia.api"

export const ENTREVISTA_IA_CURSO_KEY = ["entrevista-ia", "curso"] as const

export function useEntrevistaIaCurso(
  cursoId: string | null,
): UseQueryResult<EntrevistaIaResponse, ApiError> {
  return useQuery<EntrevistaIaResponse, ApiError>({
    queryKey: [...ENTREVISTA_IA_CURSO_KEY, cursoId ?? ""],
    queryFn: () => obtenerEntrevistaIaCurso(cursoId as string),
    staleTime: 5 * 60_000,
    enabled: !!cursoId,
  })
}
