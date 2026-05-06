import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerSeccionesAdminResponse,
  obtenerSeccionesAdminResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerSeccionesAdmin(
  cursoId: string,
  moduloId: string,
): Promise<ObtenerSeccionesAdminResponse> {
  const data = await httpClient.get<ObtenerSeccionesAdminResponse>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones`,
  )
  return obtenerSeccionesAdminResponseSchema.parse(data)
}
