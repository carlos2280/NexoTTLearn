import { httpClient } from "@/shared/api/http-client"
import { type CursoDeleteResponse, cursoDeleteResponseSchema } from "@nexott-learn/shared-types"

export async function eliminarCurso(id: string): Promise<CursoDeleteResponse> {
  const data = await httpClient.delete<CursoDeleteResponse>(`/admin/cursos/${id}`)
  return cursoDeleteResponseSchema.parse(data)
}
