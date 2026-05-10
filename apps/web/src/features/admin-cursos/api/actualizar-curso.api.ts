import { httpClient } from "@/shared/api/http-client"
import type { ActualizarCursoInput } from "@nexott-learn/shared-types"

export async function actualizarCurso(cursoId: string, input: ActualizarCursoInput): Promise<void> {
  await httpClient.patch(`/admin/cursos/${cursoId}`, input)
}
