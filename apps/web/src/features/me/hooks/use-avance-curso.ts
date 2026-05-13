import type { ApiError } from "@/shared/api/api-error"
import type { MeAvanceCursoResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerAvanceCurso } from "../api/obtener-avance-curso.api"

export const AVANCE_CURSO_KEY = ["me", "avance", "cursos"] as const

export function avanceCursoKey(cursoId: string) {
  return [...AVANCE_CURSO_KEY, cursoId] as const
}

export function useAvanceCurso(cursoId: string): UseQueryResult<MeAvanceCursoResponse, ApiError> {
  return useQuery<MeAvanceCursoResponse, ApiError>({
    queryKey: avanceCursoKey(cursoId),
    queryFn: () => obtenerAvanceCurso(cursoId),
    staleTime: 60_000,
    enabled: cursoId.length > 0,
  })
}
