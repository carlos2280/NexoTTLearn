import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarEntrevistaIAAdminInput,
  type EntrevistaIADetalleAdmin,
  type UpsertEntrevistaIAAdminInput,
  entrevistaIADetalleAdminSchema,
} from "@nexott-learn/shared-types"

export async function upsertEntrevistaIa(
  cursoId: string,
  input: UpsertEntrevistaIAAdminInput,
): Promise<EntrevistaIADetalleAdmin> {
  const data = await httpClient.put<EntrevistaIADetalleAdmin>(
    `/admin/cursos/${cursoId}/entrevista-ia`,
    input,
  )
  return entrevistaIADetalleAdminSchema.parse(data)
}

export async function actualizarEntrevistaIa(
  cursoId: string,
  input: ActualizarEntrevistaIAAdminInput,
): Promise<EntrevistaIADetalleAdmin> {
  const data = await httpClient.patch<EntrevistaIADetalleAdmin>(
    `/admin/cursos/${cursoId}/entrevista-ia`,
    input,
  )
  return entrevistaIADetalleAdminSchema.parse(data)
}

export async function eliminarEntrevistaIa(cursoId: string): Promise<void> {
  await httpClient.delete(`/admin/cursos/${cursoId}/entrevista-ia`)
}
