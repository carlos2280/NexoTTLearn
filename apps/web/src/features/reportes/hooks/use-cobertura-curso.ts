import type { CoberturaCursoQuery, CoberturaCursoResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerCoberturaCurso } from "../api/cobertura-curso.api"

export const COBERTURA_CURSO_KEYS = {
  all: ["reportes", "cobertura-curso"] as const,
  query: (query: CoberturaCursoQuery) => [...COBERTURA_CURSO_KEYS.all, query] as const,
}

export function useCoberturaCurso(
  query: CoberturaCursoQuery | null,
): UseQueryResult<CoberturaCursoResponse, Error> {
  return useQuery({
    queryKey: query
      ? COBERTURA_CURSO_KEYS.query(query)
      : ["reportes", "cobertura-curso", "disabled"],
    queryFn: ({ signal }) => {
      if (!query) {
        throw new Error("cursoId requerido")
      }
      return obtenerCoberturaCurso(query, { signal })
    },
    enabled: query !== null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
