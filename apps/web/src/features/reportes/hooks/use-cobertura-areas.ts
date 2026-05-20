import type { CoberturaAreasQuery, CoberturaAreasResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerCoberturaAreas } from "../api/cobertura-areas.api"

export const COBERTURA_AREAS_KEYS = {
  all: ["reportes", "cobertura-areas"] as const,
  query: (query: CoberturaAreasQuery) => [...COBERTURA_AREAS_KEYS.all, query] as const,
}

export function useCoberturaAreas(
  query: CoberturaAreasQuery = {},
): UseQueryResult<CoberturaAreasResponse, Error> {
  return useQuery({
    queryKey: COBERTURA_AREAS_KEYS.query(query),
    queryFn: ({ signal }) => obtenerCoberturaAreas(query, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
