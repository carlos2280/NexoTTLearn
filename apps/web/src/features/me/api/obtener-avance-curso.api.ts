import { httpClient } from "@/shared/api/http-client"
import type { MeAvanceCursoResponse } from "@nexott-learn/shared-types"

export function obtenerAvanceCurso(cursoId: string): Promise<MeAvanceCursoResponse> {
  return httpClient.get<MeAvanceCursoResponse>(`/me/avance/cursos/${cursoId}`)
}
