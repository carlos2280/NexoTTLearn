import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerModulosAdminResponse,
  type ReordenarModulosInput,
  obtenerModulosAdminResponseSchema,
} from "@nexott-learn/shared-types"

export async function reordenarModulosAdmin(
  cursoId: string,
  input: ReordenarModulosInput,
): Promise<ObtenerModulosAdminResponse> {
  const data = await httpClient.patch<ObtenerModulosAdminResponse>(
    `/admin/cursos/${cursoId}/modulos/reorder`,
    input,
  )
  return obtenerModulosAdminResponseSchema.parse(data)
}
