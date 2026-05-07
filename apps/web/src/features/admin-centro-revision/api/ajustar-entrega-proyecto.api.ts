import { httpClient } from "@/shared/api/http-client"
import {
  type AjustarEntregaProyectoAdminInput,
  type EntregaProyectoDetalleAdmin,
  entregaProyectoDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function ajustarEntregaProyecto(
  id: string,
  input: AjustarEntregaProyectoAdminInput,
): Promise<EntregaProyectoDetalleAdmin> {
  const data = await httpClient.patch<EntregaProyectoDetalleAdmin>(
    `/admin/entregas-proyecto/${id}/ajustar`,
    input,
  )
  return entregaProyectoDetalleAdminSchema.parse(data)
}
