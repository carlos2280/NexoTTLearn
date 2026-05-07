import { httpClient } from "@/shared/api/http-client"
import {
  type CursoDetalle,
  type TransicionEstadoCursoInput,
  cursoDetalleSchema,
} from "@nexott-learn/shared-types"

export async function cerrarCurso(
  id: string,
  input: TransicionEstadoCursoInput,
): Promise<CursoDetalle> {
  const data = await httpClient.post<CursoDetalle>(`/admin/cursos/${id}/cerrar`, input)
  return cursoDetalleSchema.parse(data)
}
