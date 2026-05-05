import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerModulosAdminResponse,
  obtenerModulosAdminResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerModulosAdmin(cursoId: string): Promise<ObtenerModulosAdminResponse> {
  const data = await httpClient.get<ObtenerModulosAdminResponse>(`/admin/cursos/${cursoId}/modulos`)
  return obtenerModulosAdminResponseSchema.parse(data)
}
