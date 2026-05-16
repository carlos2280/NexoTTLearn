import type { CentroRevisionQuery, CentroRevisionResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerCentroRevision } from "../api/centro-revision.api"

export const REPORTES_KEYS = {
  all: ["reportes"] as const,
  centroRevision: (query: CentroRevisionQuery) =>
    [...REPORTES_KEYS.all, "centro-revision", query] as const,
}

const DEFAULT_QUERY: CentroRevisionQuery = {
  tipo: "TODAS",
  vista: "ACTUAL",
  format: "json",
}

export function useCentroRevision(
  query: CentroRevisionQuery = DEFAULT_QUERY,
): UseQueryResult<CentroRevisionResponse, Error> {
  return useQuery({
    queryKey: REPORTES_KEYS.centroRevision(query),
    queryFn: ({ signal }) => obtenerCentroRevision(query, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
