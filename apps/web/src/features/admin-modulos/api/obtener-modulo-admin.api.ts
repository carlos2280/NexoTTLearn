import { httpClient } from "@/shared/api/http-client"
import { type ModuloAdminItem, moduloAdminItemSchema } from "@nexott-learn/shared-types"

export async function obtenerModuloAdmin(
  cursoId: string,
  moduloId: string,
): Promise<ModuloAdminItem> {
  const data = await httpClient.get<ModuloAdminItem>(`/admin/cursos/${cursoId}/modulos/${moduloId}`)
  return moduloAdminItemSchema.parse(data)
}
