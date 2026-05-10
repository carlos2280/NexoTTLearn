import { httpClient } from "@/shared/api/http-client"
import {
  type EntregaBloqueDetalleAdmin,
  type EvaluarEntregaBloqueAdminInput,
  entregaBloqueDetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function evaluarEntregaBloque(
  id: string,
  input: EvaluarEntregaBloqueAdminInput,
): Promise<EntregaBloqueDetalleAdmin> {
  const data = await httpClient.patch<EntregaBloqueDetalleAdmin>(
    `/admin/entregas-bloque/${id}/evaluar`,
    input,
  )
  return entregaBloqueDetalleAdminSchema.parse(data)
}
