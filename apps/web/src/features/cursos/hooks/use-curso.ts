import type { ApiError } from "@/shared/api/api-error"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerCurso } from "../api/obtener-curso.api"

export const CURSO_KEY = ["cursos", "detalle"] as const

export function cursoKey(cursoId: string) {
  return [...CURSO_KEY, cursoId] as const
}

export function useCurso(cursoId: string): UseQueryResult<CursoDetalle, ApiError> {
  return useQuery<CursoDetalle, ApiError>({
    queryKey: cursoKey(cursoId),
    queryFn: () => obtenerCurso(cursoId),
    staleTime: 5 * 60_000,
    enabled: cursoId.length > 0,
  })
}
