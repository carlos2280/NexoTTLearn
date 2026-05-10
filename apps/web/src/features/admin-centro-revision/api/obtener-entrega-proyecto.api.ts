import { httpClient } from "@/shared/api/http-client"
import {
  type EntregaProyectoDetalleAdmin,
  entregaProyectoDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function obtenerEntregaProyecto(id: string): Promise<EntregaProyectoDetalleAdmin> {
  const data = await httpClient.get<EntregaProyectoDetalleAdmin>(`/admin/entregas-proyecto/${id}`)
  return entregaProyectoDetalleAdminSchema.parse(data)
}
