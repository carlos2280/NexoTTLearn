import { httpClient } from "@/shared/api/http-client"
import { type Area, areaSchema } from "@nexott-learn/shared-types"

export async function restaurarArea(id: string): Promise<Area> {
  const data = await httpClient.post<Area>(`/admin/areas/${id}/restaurar`, {})
  return areaSchema.parse(data)
}
