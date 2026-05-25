import type { ListarSkillsQuery } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { listarSkills } from "../api/skills.api"

export const SKILLS_QUERY_KEY = ["catalogo", "skills"] as const

export function useListarSkills(query: ListarSkillsQuery) {
  return useQuery({
    queryKey: [...SKILLS_QUERY_KEY, "listar", query] as const,
    queryFn: () => listarSkills(query),
    placeholderData: (anterior) => anterior,
    staleTime: 30_000,
  })
}
