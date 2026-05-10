import { httpClient } from "@/shared/api/http-client"
import {
  type KpisCursoResponse,
  type SeguimientoTab,
  kpisCursoResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerKpisSeguimiento(
  cursoId: string,
  tab: SeguimientoTab = "actual",
): Promise<KpisCursoResponse> {
  const path = `/admin/cursos/${cursoId}/seguimiento/kpis?tab=${tab}`
  const data = await httpClient.get<KpisCursoResponse>(path)
  return kpisCursoResponseSchema.parse(data)
}
