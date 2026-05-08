import type { AreaListResponse, ListarAreasQuery } from "@nexott-learn/shared-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { listarAreas } from "../api/listar-areas.api"

export const ADMIN_AREAS_KEY = ["admin", "areas"] as const

export function adminAreasQueryKey(query: Partial<ListarAreasQuery>) {
  return [...ADMIN_AREAS_KEY, query] as const
}

export function useAreas(query: Partial<ListarAreasQuery> = {}) {
  return useQuery<AreaListResponse>({
    queryKey: adminAreasQueryKey(query),
    queryFn: () => listarAreas(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
