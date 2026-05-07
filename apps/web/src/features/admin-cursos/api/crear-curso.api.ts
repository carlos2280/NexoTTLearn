import { httpClient } from "@/shared/api/http-client"
import {
  type CrearCursoInput,
  type CursoDetalle,
  cursoDetalleSchema,
} from "@nexott-learn/shared-types"

export async function crearCurso(input: CrearCursoInput): Promise<CursoDetalle> {
  const data = await httpClient.post<CursoDetalle>("/admin/cursos", input)
  return cursoDetalleSchema.parse(data)
}
