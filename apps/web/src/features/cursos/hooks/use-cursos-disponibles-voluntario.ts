import type { ApiError } from "@/shared/api/api-error"
import type { CursoDisponibleVoluntario, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarCursosDisponiblesVoluntario } from "../api/listar-disponibles-voluntario.api"

export const CURSOS_DISPONIBLES_VOLUNTARIO_KEY = ["cursos", "disponibles-voluntario"] as const

export function useCursosDisponiblesVoluntario(): UseQueryResult<
  Paginated<CursoDisponibleVoluntario>,
  ApiError
> {
  return useQuery<Paginated<CursoDisponibleVoluntario>, ApiError>({
    queryKey: CURSOS_DISPONIBLES_VOLUNTARIO_KEY,
    queryFn: () => listarCursosDisponiblesVoluntario({ pageSize: 1 }),
    staleTime: 5 * 60_000,
  })
}
