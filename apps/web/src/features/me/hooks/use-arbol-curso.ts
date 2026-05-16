import type { ApiError } from "@/shared/api/api-error"
import type { CursoArbolResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerArbolCurso } from "../api/obtener-arbol-curso.api"

export const ARBOL_CURSO_KEY = ["me", "cursos", "arbol"] as const

export function arbolCursoKey(cursoId: string) {
  return [...ARBOL_CURSO_KEY, cursoId] as const
}

/**
 * `GET /me/cursos/:cursoId/arbol` — arbol del curso para los tres modos del
 * participante (asignado | voluntario | preview). El backend decide el modo
 * segun la asignacion del usuario; el frontend solo lo lee y renderiza.
 *
 * Si el usuario no tiene acceso (curso BORRADOR/CERRADO sin asignacion, o
 * `toggleVoluntarios=false`) → 404 silencioso, sin revelar existencia.
 */
export function useArbolCurso(cursoId: string): UseQueryResult<CursoArbolResponse, ApiError> {
  return useQuery<CursoArbolResponse, ApiError>({
    queryKey: arbolCursoKey(cursoId),
    queryFn: () => obtenerArbolCurso(cursoId),
    staleTime: 60_000,
    enabled: cursoId.length > 0,
    retry: false,
  })
}
