import { listarAreasCatalogo } from "@/features/admin-cursos/api/catalogo-areas.api"
import type { AreaListResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"

export const AREAS_CATALOGO_KEY = ["admin", "areas", "catalogo"] as const

export function useAreasCatalogo(query: { readonly q?: string } = {}) {
  return useQuery<AreaListResponse>({
    queryKey: [...AREAS_CATALOGO_KEY, query.q ?? ""],
    queryFn: () => listarAreasCatalogo({ q: query.q, estado: "ACTIVA", pageSize: 100 }),
    staleTime: 60_000,
  })
}
