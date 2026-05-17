import { httpClient } from "@/shared/api/http-client"
import type {
  CrearIntentoEntrevistaIaResponse,
  EnviarTurnoInput,
  EnviarTurnoResponse,
  IntentoEntrevistaIaParticipanteResponse,
} from "@nexott-learn/shared-types"

/**
 * `POST /api/v1/asignaciones/:asignacionId/intentos-entrevista-ia` (D-S8-D1).
 * Crea un intento nuevo y devuelve la primera pregunta de la IA.
 */
export function crearIntentoEntrevistaIa(
  asignacionId: string,
): Promise<CrearIntentoEntrevistaIaResponse> {
  return httpClient.post<CrearIntentoEntrevistaIaResponse>(
    `/asignaciones/${asignacionId}/intentos-entrevista-ia`,
    {},
  )
}

/**
 * `POST /api/v1/intentos-entrevista-ia/:intentoId/turnos` (D-S8-D2).
 * Envia el mensaje del colaborador y recibe la respuesta de la IA + la
 * siguiente pregunta (o `finalizado=true` si la IA cierra la conversacion).
 */
export function enviarTurno(input: {
  readonly intentoId: string
  readonly body: EnviarTurnoInput
}): Promise<EnviarTurnoResponse> {
  return httpClient.post<EnviarTurnoResponse>(
    `/intentos-entrevista-ia/${input.intentoId}/turnos`,
    input.body,
  )
}

/**
 * `GET /api/v1/intentos-entrevista-ia/:intentoId` — detalle del intento con
 * la transcripcion completa. Util para retomar un intento `EN_PROGRESO` al
 * volver a la pantalla (B-15) y para el drawer "Releer entrevista" (F3).
 */
export function obtenerIntentoEntrevistaIa(
  intentoId: string,
): Promise<IntentoEntrevistaIaParticipanteResponse> {
  return httpClient.get<IntentoEntrevistaIaParticipanteResponse>(
    `/intentos-entrevista-ia/${intentoId}`,
  )
}
