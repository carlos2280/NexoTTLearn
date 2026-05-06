import { httpClient } from "@/shared/api/http-client"
import {
  type CrearSeccionInput,
  type SeccionAdminItem,
  seccionAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function crearSeccionAdmin(
  cursoId: string,
  moduloId: string,
  input: CrearSeccionInput,
): Promise<SeccionAdminItem> {
  const data = await httpClient.post<SeccionAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones`,
    input,
  )
  return seccionAdminItemSchema.parse(data)
}
