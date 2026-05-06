import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerSeccionesAdminResponse,
  type ReordenarSeccionesInput,
  obtenerSeccionesAdminResponseSchema,
} from "@nexott-learn/shared-types"

// IMPORTANTE: el back expone reorder en `/secciones/orden` (no `/reorder`).
// El controller declara la ruta estatica antes que `/:seccionId` para que
// NestJS no la capture como param.
export async function reordenarSeccionesAdmin(
  cursoId: string,
  moduloId: string,
  input: ReordenarSeccionesInput,
): Promise<ObtenerSeccionesAdminResponse> {
  const data = await httpClient.patch<ObtenerSeccionesAdminResponse>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/orden`,
    input,
  )
  return obtenerSeccionesAdminResponseSchema.parse(data)
}
