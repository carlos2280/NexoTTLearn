import type { ListarColaboradoresQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarColaboradores } from "../api/colaboradores.api"

export const PERSONAS_QUERY_KEY = ["personas"] as const

export function useListarPersonas(query: ListarColaboradoresQuery) {
  return useQuery({
    queryKey: [...PERSONAS_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarColaboradores(query),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
