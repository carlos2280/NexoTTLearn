import type { ListarBloquesQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarBloques } from "../api/bloques.api"

export const BLOQUES_QUERY_KEY = ["catalogo", "bloques"] as const

export function useListarBloques(query: ListarBloquesQuery) {
  return useQuery({
    queryKey: [...BLOQUES_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarBloques(query),
    placeholderData: (anterior) => anterior,
    staleTime: 15_000,
  })
}
