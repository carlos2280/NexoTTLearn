import type { ApiError } from "@/shared/api/api-error"
import type { MeCursoResumen, MeCursosQuery, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarMisCursos } from "../api/listar-mis-cursos.api"

export const MIS_CURSOS_KEY = ["me", "cursos"] as const

export function misCursosKey(filtros?: Partial<MeCursosQuery>) {
  return [...MIS_CURSOS_KEY, filtros ?? {}] as const
}

export function useMisCursos(
  filtros?: Partial<MeCursosQuery>,
): UseQueryResult<Paginated<MeCursoResumen>, ApiError> {
  return useQuery<Paginated<MeCursoResumen>, ApiError>({
    queryKey: misCursosKey(filtros),
    queryFn: () => listarMisCursos(filtros),
    staleTime: 60_000,
  })
}
