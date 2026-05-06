import { httpClient } from "@/shared/api/http-client"
import { type ActualizarAreaInput, type Area, areaSchema } from "@nexott-learn/shared-types"

export async function actualizarArea(id: string, input: ActualizarAreaInput): Promise<Area> {
  const data = await httpClient.patch<Area>(`/admin/areas/${id}`, input)
  return areaSchema.parse(data)
}
