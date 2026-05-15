import type {
  EficaciaPlataformaQuery,
  EficaciaPlataformaResponse,
} from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerEficaciaPlataforma } from "../api/eficacia-plataforma.api"

export const EFICACIA_KEYS = {
  all: ["reportes", "eficacia-plataforma"] as const,
  query: (query: EficaciaPlataformaQuery) => [...EFICACIA_KEYS.all, query] as const,
}

const DEFAULT_QUERY: EficaciaPlataformaQuery = {
  format: "json",
}

export function useEficaciaPlataforma(
  query: EficaciaPlataformaQuery = DEFAULT_QUERY,
): UseQueryResult<EficaciaPlataformaResponse, Error> {
  return useQuery({
    queryKey: EFICACIA_KEYS.query(query),
    queryFn: ({ signal }) => obtenerEficaciaPlataforma(query, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
