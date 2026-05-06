import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarPesosCursoInput,
  type CursoAdminDetalle,
  cursoAdminDetalleSchema,
} from "@nexott-learn/shared-types"

export async function actualizarPesosCurso(
  id: string,
  input: ActualizarPesosCursoInput,
): Promise<CursoAdminDetalle> {
  const data = await httpClient.patch<CursoAdminDetalle>(`/admin/cursos/${id}/pesos`, input)
  return cursoAdminDetalleSchema.parse(data)
}
