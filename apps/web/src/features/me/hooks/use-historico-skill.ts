import { useQuery } from "@tanstack/react-query"
import { obtenerHistoricoSkill } from "../api/obtener-historico-skill.api"

export const HISTORICO_SKILL_KEY = (colaboradorId: string, skillId: string) =>
  ["me", "ficha", "skill", skillId, "historico", colaboradorId] as const

interface UseHistoricoSkillArgs {
  readonly colaboradorId: string | undefined
  readonly skillId: string | null
}

export function useHistoricoSkill({ colaboradorId, skillId }: UseHistoricoSkillArgs) {
  return useQuery({
    queryKey:
      colaboradorId && skillId
        ? HISTORICO_SKILL_KEY(colaboradorId, skillId)
        : (["me", "ficha", "skill", "noop"] as const),
    queryFn: () => obtenerHistoricoSkill(colaboradorId ?? "", skillId ?? ""),
    enabled: Boolean(colaboradorId && skillId),
    staleTime: 60_000,
  })
}
