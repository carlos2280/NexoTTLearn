import { httpClient } from "@/shared/api/http-client"
import type { EntradaHistoricoNotaSkill, Paginated } from "@nexott-learn/shared-types"

export async function obtenerHistoricoSkill(
  colaboradorId: string,
  skillId: string,
): Promise<readonly EntradaHistoricoNotaSkill[]> {
  const respuesta = await httpClient.get<Paginated<EntradaHistoricoNotaSkill>>(
    `/colaboradores/${colaboradorId}/ficha/skills/${skillId}/historico`,
  )
  return respuesta.data
}
