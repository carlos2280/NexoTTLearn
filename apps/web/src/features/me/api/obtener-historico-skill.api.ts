import { httpClient } from "@/shared/api/http-client"
import type { EntradaHistoricoNotaSkill } from "@nexott-learn/shared-types"

export function obtenerHistoricoSkill(
  colaboradorId: string,
  skillId: string,
): Promise<readonly EntradaHistoricoNotaSkill[]> {
  return httpClient.get<readonly EntradaHistoricoNotaSkill[]>(
    `/colaboradores/${colaboradorId}/ficha/skills/${skillId}/historico`,
  )
}
