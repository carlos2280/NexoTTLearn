import { httpClient } from "@/shared/api/http-client"
import {
  type ClonarModuloInput,
  type ModuloAdminItem,
  moduloAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function clonarModuloAdmin(
  cursoIdDestino: string,
  input: ClonarModuloInput,
): Promise<ModuloAdminItem> {
  const data = await httpClient.post<ModuloAdminItem>(
    `/admin/cursos/${cursoIdDestino}/modulos/clonar`,
    input,
  )
  return moduloAdminItemSchema.parse(data)
}
