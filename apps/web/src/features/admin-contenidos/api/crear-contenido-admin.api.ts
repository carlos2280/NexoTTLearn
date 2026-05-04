import { httpClient } from "@/shared/api/http-client"
import {
  type ContenidoAdminItem,
  type CrearContenidoInput,
  contenidoAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function crearContenidoAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  input: CrearContenidoInput,
): Promise<ContenidoAdminItem> {
  const data = await httpClient.post<ContenidoAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos`,
    input,
  )
  return contenidoAdminItemSchema.parse(data)
}
