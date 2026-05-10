import { httpClient } from "@/shared/api/http-client"
import {
  type CohorteAreasResponse,
  type CohorteDistribucionResponse,
  type CohorteSerieResponse,
  cohorteAreasResponseSchema,
  cohorteDistribucionResponseSchema,
  cohorteSerieResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerCohorteSerie(cursoId: string): Promise<CohorteSerieResponse> {
  const data = await httpClient.get<CohorteSerieResponse>(
    `/admin/cursos/${cursoId}/seguimiento/cohorte/serie`,
  )
  return cohorteSerieResponseSchema.parse(data)
}

export async function obtenerCohorteAreas(cursoId: string): Promise<CohorteAreasResponse> {
  const data = await httpClient.get<CohorteAreasResponse>(
    `/admin/cursos/${cursoId}/seguimiento/cohorte/areas`,
  )
  return cohorteAreasResponseSchema.parse(data)
}

export async function obtenerCohorteDistribucion(
  cursoId: string,
): Promise<CohorteDistribucionResponse> {
  const data = await httpClient.get<CohorteDistribucionResponse>(
    `/admin/cursos/${cursoId}/seguimiento/cohorte/distribucion`,
  )
  return cohorteDistribucionResponseSchema.parse(data)
}
