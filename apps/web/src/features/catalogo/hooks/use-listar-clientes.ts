import type { ListarClientesQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarClientes } from "../api/clientes.api"

export const CLIENTES_QUERY_KEY = ["catalogo", "clientes"] as const

export function useListarClientes(query: ListarClientesQuery) {
  return useQuery({
    queryKey: [...CLIENTES_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarClientes(query),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
