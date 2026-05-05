import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerContenidosAdminResponse,
  type ReordenarContenidosInput,
  obtenerContenidosAdminResponseSchema,
} from "@nexott-learn/shared-types"

// El back expone reorder en `/contenidos/orden` (la ruta estatica se declara
// antes que `/:contenidoId` en el controller).
export async function reordenarContenidosAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  input: ReordenarContenidosInput,
): Promise<ObtenerContenidosAdminResponse> {
  const data = await httpClient.patch<ObtenerContenidosAdminResponse>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos/orden`,
    input,
  )
  return obtenerContenidosAdminResponseSchema.parse(data)
}
