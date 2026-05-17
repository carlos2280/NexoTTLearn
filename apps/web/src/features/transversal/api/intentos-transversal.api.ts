import { httpClient } from "@/shared/api/http-client"
import type {
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
  IntentoTransversalParticipanteResponse,
} from "@nexott-learn/shared-types"

/**
 * `POST /api/v1/asignaciones/:asignacionId/intentos-transversal` (D-S8-C1).
 * Solo devuelve `intentoId`, `estado` y ETA aproximado. La evaluacion completa
 * llega por polling al detalle del intento.
 */
export function crearIntentoTransversal(input: {
  readonly asignacionId: string
  readonly body: CrearIntentoTransversalInput
}): Promise<CrearIntentoTransversalResponse> {
  return httpClient.post<CrearIntentoTransversalResponse>(
    `/asignaciones/${input.asignacionId}/intentos-transversal`,
    input.body,
  )
}

/**
 * `GET /api/v1/asignaciones/:asignacionId/intentos-transversal` — historial de
 * intentos del participante en este transversal. PARTICIPANTE solo recibe la
 * proyeccion sin notas internas (D-S8-C2 / D-S8-C3).
 */
export function listarIntentosTransversal(
  asignacionId: string,
): Promise<readonly IntentoTransversalParticipanteResponse[]> {
  return httpClient.get<readonly IntentoTransversalParticipanteResponse[]>(
    `/asignaciones/${asignacionId}/intentos-transversal`,
  )
}
