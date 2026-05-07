import { httpClient } from "@/shared/api/http-client"
import {
  type AjustarEntregaBloqueAdminInput,
  type EntregaBloqueDetalleAdmin,
  entregaBloqueDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function ajustarEntregaBloque(
  id: string,
  input: AjustarEntregaBloqueAdminInput,
): Promise<EntregaBloqueDetalleAdmin> {
  const data = await httpClient.patch<EntregaBloqueDetalleAdmin>(
    `/admin/entregas-bloque/${id}/ajustar`,
    input,
  )
  return entregaBloqueDetalleAdminSchema.parse(data)
}
