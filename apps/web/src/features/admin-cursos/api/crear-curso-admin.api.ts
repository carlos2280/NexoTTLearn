import { httpClient } from "@/shared/api/http-client"
import {
  type CrearCursoInput,
  type CursoAdminDetalle,
  cursoAdminDetalleSchema,
} from "@nexott-learn/shared-types"

export async function crearCursoAdmin(input: CrearCursoInput): Promise<CursoAdminDetalle> {
  const data = await httpClient.post<CursoAdminDetalle>("/admin/cursos", input)
  return cursoAdminDetalleSchema.parse(data)
}
