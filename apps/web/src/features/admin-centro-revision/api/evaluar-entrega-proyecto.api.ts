import { httpClient } from "@/shared/api/http-client"
import {
  type EntregaProyectoDetalleAdmin,
  type EvaluarEntregaProyectoAdminInput,
  entregaProyectoDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function evaluarEntregaProyecto(
  id: string,
  input: EvaluarEntregaProyectoAdminInput,
): Promise<EntregaProyectoDetalleAdmin> {
  const data = await httpClient.patch<EntregaProyectoDetalleAdmin>(
    `/admin/entregas-proyecto/${id}/evaluar`,
    input,
  )
  return entregaProyectoDetalleAdminSchema.parse(data)
}
