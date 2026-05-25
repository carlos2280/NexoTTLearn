import { httpClient } from "@/shared/api/http-client"
import type { CursoArbolResponse } from "@nexott-learn/shared-types"

export function obtenerArbolCurso(cursoId: string): Promise<CursoArbolResponse> {
  return httpClient.get<CursoArbolResponse>(`/me/cursos/${cursoId}/arbol`)
}
