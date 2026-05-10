import { httpClient } from "@/shared/api/http-client"
import { type CursoDetalle, cursoDetalleSchema } from "@nexott-learn/shared-types"

export async function obtenerCursoDetalle(id: string): Promise<CursoDetalle> {
  const data = await httpClient.get<CursoDetalle>(`/admin/cursos/${id}`)
  return cursoDetalleSchema.parse(data)
}
