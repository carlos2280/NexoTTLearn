import { httpClient } from "@/shared/api/http-client"
import {
  type CeldaDetalleResponse,
  type SeguimientoTab,
  celdaDetalleResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerCeldaDetalle(
  cursoId: string,
  inscripcionId: string,
  areaId: string,
  tab: SeguimientoTab = "actual",
): Promise<CeldaDetalleResponse> {
  const path = `/admin/cursos/${cursoId}/seguimiento/celda/${inscripcionId}/${areaId}?tab=${tab}`
  const data = await httpClient.get<CeldaDetalleResponse>(path)
  return celdaDetalleResponseSchema.parse(data)
}
