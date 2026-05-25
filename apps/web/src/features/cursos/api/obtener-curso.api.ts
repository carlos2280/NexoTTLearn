import { httpClient } from "@/shared/api/http-client"
import type { CursoDetalle } from "@nexott-learn/shared-types"

export function obtenerCurso(cursoId: string): Promise<CursoDetalle> {
  return httpClient.get<CursoDetalle>(`/cursos/${cursoId}`)
}
