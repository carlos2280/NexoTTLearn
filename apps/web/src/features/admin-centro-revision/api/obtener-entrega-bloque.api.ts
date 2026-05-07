import { httpClient } from "@/shared/api/http-client"
import {
  type EntregaBloqueDetalleAdmin,
  entregaBloqueDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function obtenerEntregaBloque(id: string): Promise<EntregaBloqueDetalleAdmin> {
  const data = await httpClient.get<EntregaBloqueDetalleAdmin>(`/admin/entregas-bloque/${id}`)
  return entregaBloqueDetalleAdminSchema.parse(data)
}
