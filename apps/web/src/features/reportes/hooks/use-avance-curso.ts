import type { AvanceCursoQuery } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { type AvanceCursoResponse, obtenerAvanceCurso } from "../api/avance-curso.api"

export const AVANCE_CURSO_KEYS = {
  all: ["reportes", "avance-curso"] as const,
  query: (query: AvanceCursoQuery) => [...AVANCE_CURSO_KEYS.all, query] as const,
}

export function useAvanceCurso(
  query: AvanceCursoQuery | null,
): UseQueryResult<AvanceCursoResponse, Error> {
  return useQuery({
    queryKey: query ? AVANCE_CURSO_KEYS.query(query) : ["reportes", "avance-curso", "disabled"],
    queryFn: ({ signal }) => {
      if (!query) {
        throw new Error("query requerida")
      }
      return obtenerAvanceCurso(query, { signal })
    },
    enabled: query !== null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
