import type { InventarioSkillsQuery, InventarioSkillsResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerInventarioSkills } from "../api/inventario-skills.api"

export const INVENTARIO_SKILLS_KEYS = {
  all: ["reportes", "inventario-skills"] as const,
  query: (query: InventarioSkillsQuery) => [...INVENTARIO_SKILLS_KEYS.all, query] as const,
}

const DEFAULT_QUERY: InventarioSkillsQuery = {
  umbralCumple: 70,
  format: "json",
}

export function useInventarioSkills(
  query: InventarioSkillsQuery = DEFAULT_QUERY,
): UseQueryResult<InventarioSkillsResponse, Error> {
  return useQuery({
    queryKey: INVENTARIO_SKILLS_KEYS.query(query),
    queryFn: ({ signal }) => obtenerInventarioSkills(query, { signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
