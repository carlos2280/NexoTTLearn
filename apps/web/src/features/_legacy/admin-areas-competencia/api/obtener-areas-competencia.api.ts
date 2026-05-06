import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerAreasCompetenciaResponse,
  obtenerAreasCompetenciaResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerAreasCompetencia(): Promise<ObtenerAreasCompetenciaResponse> {
  const data = await httpClient.get<ObtenerAreasCompetenciaResponse>("/admin/areas-competencia")
  return obtenerAreasCompetenciaResponseSchema.parse(data)
}
