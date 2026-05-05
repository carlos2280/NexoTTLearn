import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarModuloInput,
  type ModuloAdminItem,
  moduloAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function actualizarModuloAdmin(
  cursoId: string,
  moduloId: string,
  input: ActualizarModuloInput,
): Promise<ModuloAdminItem> {
  const data = await httpClient.patch<ModuloAdminItem>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}`,
    input,
  )
  return moduloAdminItemSchema.parse(data)
}
