import type { ListarCursosQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarCursos } from "../api/cursos.api"

export const CURSOS_QUERY_KEY = ["cursos"] as const

export function useListarCursos(query: ListarCursosQuery) {
  return useQuery({
    queryKey: [...CURSOS_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarCursos(query),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
