import { httpClient } from "@/shared/api/http-client"
import { type Area, type CrearAreaInput, areaSchema } from "@nexott-learn/shared-types"

export async function crearArea(input: CrearAreaInput): Promise<Area> {
  const data = await httpClient.post<Area>("/admin/areas", input)
  return areaSchema.parse(data)
}
