import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarContenidoInput,
  type ContenidoAdminItem,
  contenidoAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function actualizarContenidoAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
  input: ActualizarContenidoInput,
): Promise<ContenidoAdminItem> {
  const data = await httpClient.patch<ContenidoAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos/${contenidoId}`,
    input,
  )
  return contenidoAdminItemSchema.parse(data)
}
