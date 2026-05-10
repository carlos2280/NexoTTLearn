import { httpClient } from "@/shared/api/http-client"
import {
  type CursoDetalle,
  type TransicionEstadoCursoInput,
  cursoDetalleSchema,
} from "@nexott-learn/shared-types"

export async function despublicarCurso(
  id: string,
  input: TransicionEstadoCursoInput,
): Promise<CursoDetalle> {
  const data = await httpClient.post<CursoDetalle>(`/admin/cursos/${id}/despublicar`, input)
  return cursoDetalleSchema.parse(data)
}
