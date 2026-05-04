import { httpClient } from "@/shared/api/http-client"

// El endpoint responde 204 No Content; httpClient devuelve undefined.
export async function eliminarContenidoAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
): Promise<void> {
  await httpClient.delete<void>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos/${contenidoId}`,
  )
}
