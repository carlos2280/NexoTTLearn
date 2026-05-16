import { httpClient } from "@/shared/api/http-client"
import type { ResumenCierreCurso } from "@nexott-learn/shared-types"

export function obtenerResumenCierre(cursoId: string): Promise<ResumenCierreCurso> {
  return httpClient.get<ResumenCierreCurso>(`/me/cursos/${cursoId}/resumen-cierre`)
}
