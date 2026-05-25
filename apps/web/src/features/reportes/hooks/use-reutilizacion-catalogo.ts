import type {
  ReutilizacionCatalogoQuery,
  ReutilizacionCatalogoResponse,
} from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerReutilizacionCatalogo } from "../api/reutilizacion-catalogo.api"

export const REUTILIZACION_KEYS = {
  all: ["reportes", "reutilizacion-catalogo"] as const,
  query: (query: ReutilizacionCatalogoQuery) => [...REUTILIZACION_KEYS.all, query] as const,
}

const DEFAULT_QUERY: ReutilizacionCatalogoQuery = {
  format: "json",
}

export function useReutilizacionCatalogo(
  query: ReutilizacionCatalogoQuery = DEFAULT_QUERY,
): UseQueryResult<ReutilizacionCatalogoResponse, Error> {
  return useQuery({
    queryKey: REUTILIZACION_KEYS.query(query),
    queryFn: ({ signal }) => obtenerReutilizacionCatalogo(query, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
