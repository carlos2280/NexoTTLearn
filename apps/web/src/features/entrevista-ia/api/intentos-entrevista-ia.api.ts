import { httpClient } from "@/shared/api/http-client"
import type {
  AjustarEntrevistaResponse,
  AnularEntrevistaResponse,
  CrearIntentoEntrevistaIaResponse,
  EnviarTurnoInput,
  EnviarTurnoResponse,
  IntentoEntrevistaIaAdminResponse,
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
    { idempotencyKey: crypto.randomUUID() },
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

/**
 * `GET /api/v1/intentos-entrevista-ia/:intentoId` — variante ADMIN. El
 * endpoint es el mismo; el backend ajusta la proyeccion segun el rol y
 * devuelve `colaborador`, `curso`, `notaAjustadaAdmin` y `motivoAjusteOAnulacion`.
 */
export function obtenerIntentoEntrevistaIaAdmin(
  intentoId: string,
): Promise<IntentoEntrevistaIaAdminResponse> {
  return httpClient.get<IntentoEntrevistaIaAdminResponse>(`/intentos-entrevista-ia/${intentoId}`)
}

/**
 * `POST /api/v1/intentos-entrevista-ia/:intentoId/ajustar` (E19, admin).
 * Ajusta manualmente la nota global del intento y dispara recalculo de
 * skills. `motivo` viaja en header `X-Motivo` y queda en `consultas_logs`.
 */
export function ajustarIntentoEntrevistaIa(input: {
  readonly intentoId: string
  readonly notaAjustada: number
  readonly motivo: string
}): Promise<AjustarEntrevistaResponse> {
  return httpClient.post<AjustarEntrevistaResponse>(
    `/intentos-entrevista-ia/${input.intentoId}/ajustar`,
    { notaAjustada: input.notaAjustada },
    { motivo: input.motivo },
  )
}

/**
 * `POST /api/v1/intentos-entrevista-ia/:intentoId/anular` (E20, admin).
 * Anula el intento y dispara recalculo de skills. Idempotente: el segundo
 * POST con la misma `Idempotency-Key` (UUID) devuelve el resultado cacheado
 * sin re-ejecutar la accion.
 */
export function anularIntentoEntrevistaIa(input: {
  readonly intentoId: string
  readonly motivo: string
}): Promise<AnularEntrevistaResponse> {
  return httpClient.post<AnularEntrevistaResponse>(
    `/intentos-entrevista-ia/${input.intentoId}/anular`,
    {},
    { motivo: input.motivo, idempotencyKey: crypto.randomUUID() },
  )
}
