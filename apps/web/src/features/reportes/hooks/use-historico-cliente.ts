import type { HistoricoClienteQuery, HistoricoClienteResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerHistoricoCliente } from "../api/historico-cliente.api"

export const HISTORICO_CLIENTE_KEYS = {
  all: ["reportes", "historico-cliente"] as const,
  query: (query: HistoricoClienteQuery) => [...HISTORICO_CLIENTE_KEYS.all, query] as const,
}

export function useHistoricoCliente(
  query: HistoricoClienteQuery | null,
): UseQueryResult<HistoricoClienteResponse, Error> {
  return useQuery({
    queryKey: query
      ? HISTORICO_CLIENTE_KEYS.query(query)
      : ["reportes", "historico-cliente", "disabled"],
    queryFn: ({ signal }) => {
      if (!query) {
        throw new Error("query requerida")
      }
      return obtenerHistoricoCliente(query, { signal })
    },
    enabled: query !== null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
