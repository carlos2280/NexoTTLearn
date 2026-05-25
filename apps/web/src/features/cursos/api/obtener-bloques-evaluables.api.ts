import { httpClient } from "@/shared/api/http-client"
import type {
  BloqueEvaluableAdminItem,
  BloqueEvaluableDetalleResponse,
} from "@nexott-learn/shared-types"

export function obtenerBloquesEvaluables(
  cursoId: string,
): Promise<readonly BloqueEvaluableAdminItem[]> {
  return httpClient.get<readonly BloqueEvaluableAdminItem[]>(
    `/cursos/${cursoId}/bloques-evaluables`,
  )
}

export function obtenerDetalleBloqueEvaluable(
  cursoId: string,
  bloqueId: string,
): Promise<BloqueEvaluableDetalleResponse> {
  return httpClient.get<BloqueEvaluableDetalleResponse>(
    `/cursos/${cursoId}/bloques-evaluables/${bloqueId}/colaboradores`,
  )
}
