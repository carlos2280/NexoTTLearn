import { httpClient } from "@/shared/api/http-client"
import { type PublicarResponse, publicarResponseSchema } from "@nexott-learn/shared-types"

export async function publicarCurso(cursoId: string): Promise<PublicarResponse> {
  const data = await httpClient.post<PublicarResponse>(
    `/admin/cursos/${cursoId}/publicar`,
    undefined,
  )
  return publicarResponseSchema.parse(data)
}
