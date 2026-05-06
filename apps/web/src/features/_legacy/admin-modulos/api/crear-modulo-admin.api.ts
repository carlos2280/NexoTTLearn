import { httpClient } from "@/shared/api/http-client"
import {
  type CrearModuloInput,
  type ModuloAdminItem,
  moduloAdminItemSchema,
} from "@nexott-learn/shared-types"

export async function crearModuloAdmin(
  cursoId: string,
  input: CrearModuloInput,
): Promise<ModuloAdminItem> {
  const data = await httpClient.post<ModuloAdminItem>(`/admin/cursos/${cursoId}/modulos`, input)
  return moduloAdminItemSchema.parse(data)
}
