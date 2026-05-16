import type { ListarAreasQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarAreas } from "../api/areas.api"

export const AREAS_QUERY_KEY = ["catalogo", "areas"] as const

export function areasQueryKey(query: ListarAreasQuery) {
  return [...AREAS_QUERY_KEY, "listar", query] as const
}

export function useListarAreas(query: ListarAreasQuery) {
  return useQuery({
    queryKey: areasQueryKey(query),
    queryFn: () => listarAreas(query),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
