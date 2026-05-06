import { httpClient } from "@/shared/api/http-client"
import { type AreaDeleteResponse, areaDeleteResponseSchema } from "@nexott-learn/shared-types"

/**
 * El backend decide si soft-elimina (→ OBSOLETA) o hard-elimina según
 * referencias. El cliente solo lee el `tipo` para mostrar el mensaje correcto.
 */
export async function eliminarArea(id: string): Promise<AreaDeleteResponse> {
  const data = await httpClient.delete<AreaDeleteResponse>(`/admin/areas/${id}`)
  return areaDeleteResponseSchema.parse(data)
}
