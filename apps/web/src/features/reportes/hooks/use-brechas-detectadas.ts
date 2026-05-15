import type { BrechasDetectadasQuery, BrechasDetectadasResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerBrechasDetectadas } from "../api/brechas-detectadas.api"

export const BRECHAS_KEYS = {
  all: ["reportes", "brechas-detectadas"] as const,
  query: (query: BrechasDetectadasQuery) => [...BRECHAS_KEYS.all, query] as const,
}

export function useBrechasDetectadas(
  query: BrechasDetectadasQuery | null,
): UseQueryResult<BrechasDetectadasResponse, Error> {
  return useQuery({
    queryKey: query ? BRECHAS_KEYS.query(query) : ["reportes", "brechas-detectadas", "disabled"],
    queryFn: ({ signal }) => {
      if (!query) {
        throw new Error("query requerida")
      }
      return obtenerBrechasDetectadas(query, { signal })
    },
    enabled: query !== null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
