import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarCursoInput,
  type CursoAdminDetalle,
  cursoAdminDetalleSchema,
} from "@nexott-learn/shared-types"

export async function actualizarCursoAdmin(
  id: string,
  input: ActualizarCursoInput,
): Promise<CursoAdminDetalle> {
  const data = await httpClient.patch<CursoAdminDetalle>(`/admin/cursos/${id}`, input)
  return cursoAdminDetalleSchema.parse(data)
}
