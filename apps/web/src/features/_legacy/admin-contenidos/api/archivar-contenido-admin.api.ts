import { httpClient } from "@/shared/api/http-client"
import { type ContenidoAdminItem, contenidoAdminItemSchema } from "@nexott-learn/shared-types"

export async function archivarContenidoAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
): Promise<ContenidoAdminItem> {
  const data = await httpClient.post<ContenidoAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos/${contenidoId}/archivar`,
    {},
  )
  return contenidoAdminItemSchema.parse(data)
}

export async function restaurarContenidoAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
): Promise<ContenidoAdminItem> {
  const data = await httpClient.post<ContenidoAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos/${contenidoId}/restaurar`,
    {},
  )
  return contenidoAdminItemSchema.parse(data)
}
