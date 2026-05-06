import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarSeccionInput,
  type SeccionAdminItem,
  seccionAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function actualizarSeccionAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  input: ActualizarSeccionInput,
): Promise<SeccionAdminItem> {
  const data = await httpClient.patch<SeccionAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}`,
    input,
  )
  return seccionAdminItemSchema.parse(data)
}
