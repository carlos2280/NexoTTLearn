import type { CursoListResponse, ListarCursosQuery } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { listarCursos } from "../api/listar-cursos.api"

export const ADMIN_CURSOS_KEY = ["admin", "cursos"] as const

export function adminCursosQueryKey(query: Partial<ListarCursosQuery>) {
  return [...ADMIN_CURSOS_KEY, query] as const
}

export function useCursos(query: Partial<ListarCursosQuery> = {}) {
  return useQuery<CursoListResponse>({
    queryKey: adminCursosQueryKey(query),
    queryFn: () => listarCursos(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
