import { httpClient } from "@/shared/api/http-client"
import {
  type ObtenerContenidosAdminResponse,
  obtenerContenidosAdminResponseSchema,
} from "@nexott-learn/shared-types"

interface ObtenerContenidosOptions {
  readonly incluirArchivados?: boolean
}

export async function obtenerContenidosAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  options: ObtenerContenidosOptions = {},
): Promise<ObtenerContenidosAdminResponse> {
  // biome-ignore lint/nursery/noSecrets: query string del endpoint admin, no es secreto
  const incluir = options.incluirArchivados ? "?incluirArchivados=true" : ""
  const data = await httpClient.get<ObtenerContenidosAdminResponse>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}/contenidos${incluir}`,
  )
  return obtenerContenidosAdminResponseSchema.parse(data)
}
