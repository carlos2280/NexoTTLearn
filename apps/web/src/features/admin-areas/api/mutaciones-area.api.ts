import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarAreaInput,
  type AreaConContadores,
  type AreaDeleteResponse,
  type CrearAreaInput,
  areaConContadoresSchema,
  areaDeleteResponseSchema,
} from "@nexott-learn/shared-types"

export async function crearArea(input: CrearAreaInput): Promise<AreaConContadores> {
  const data = await httpClient.post<AreaConContadores>("/admin/areas", input)
  return areaConContadoresSchema.parse(data)
}

export async function actualizarArea(
  id: string,
  input: ActualizarAreaInput,
): Promise<AreaConContadores> {
  const data = await httpClient.patch<AreaConContadores>(`/admin/areas/${id}`, input)
  return areaConContadoresSchema.parse(data)
}

export async function eliminarArea(id: string): Promise<AreaDeleteResponse> {
  const data = await httpClient.delete<AreaDeleteResponse>(`/admin/areas/${id}`)
  return areaDeleteResponseSchema.parse(data)
}

export async function restaurarArea(id: string): Promise<AreaConContadores> {
  const data = await httpClient.post<AreaConContadores>(`/admin/areas/${id}/restaurar`, {})
  return areaConContadoresSchema.parse(data)
}
