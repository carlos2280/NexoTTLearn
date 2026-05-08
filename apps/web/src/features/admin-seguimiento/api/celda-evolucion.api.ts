import { httpClient } from "@/shared/api/http-client"
import {
  type CeldaEvolucionResponse,
  celdaEvolucionResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerCeldaEvolucion(
  cursoId: string,
  inscripcionId: string,
  areaId: string,
): Promise<CeldaEvolucionResponse> {
  const data = await httpClient.get<CeldaEvolucionResponse>(
    `/admin/cursos/${cursoId}/seguimiento/celda/${inscripcionId}/${areaId}/evolucion`,
  )
  return celdaEvolucionResponseSchema.parse(data)
}
