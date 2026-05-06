import { httpClient } from "@/shared/api/http-client"
import { type ContenidoAdminItem, contenidoAdminItemSchema } from "@nexott-learn/shared-types"

export async function obtenerContenidoAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
): Promise<ContenidoAdminItem> {
  const data = await httpClient.get<ContenidoAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos/${contenidoId}`,
  )
  return contenidoAdminItemSchema.parse(data)
}
