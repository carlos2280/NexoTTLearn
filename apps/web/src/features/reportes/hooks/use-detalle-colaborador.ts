import type {
  DetalleColaboradorQuery,
  DetalleColaboradorResponse,
} from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerDetalleColaborador } from "../api/detalle-colaborador.api"

export const DETALLE_COLABORADOR_KEYS = {
  all: ["reportes", "detalle-colaborador"] as const,
  query: (query: DetalleColaboradorQuery) => [...DETALLE_COLABORADOR_KEYS.all, query] as const,
}

export function useDetalleColaborador(
  query: DetalleColaboradorQuery | null,
): UseQueryResult<DetalleColaboradorResponse, Error> {
  return useQuery({
    queryKey: query
      ? DETALLE_COLABORADOR_KEYS.query(query)
      : ["reportes", "detalle-colaborador", "disabled"],
    queryFn: ({ signal }) => {
      if (!query) {
        throw new Error("query requerida")
      }
      return obtenerDetalleColaborador(query, { signal })
    },
    enabled: query !== null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
