import { httpClient } from "@/shared/api/http-client"
import type {
  AnularTransversalResponse,
  CargarCapaComprensionInput,
  CargarCapaCualitativaInput,
  CargarCapaTestsInput,
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
  FinalizarTransversalResponse,
  IntentoTransversalAdminResponse,
  IntentoTransversalParticipanteResponse,
  Paginated,
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
    { idempotencyKey: crypto.randomUUID() },
  )
}

/**
 * `GET /api/v1/asignaciones/:asignacionId/intentos-transversal` — historial de
 * intentos del participante en este transversal. PARTICIPANTE solo recibe la
 * proyeccion sin notas internas (D-S8-C2 / D-S8-C3).
 */
export async function listarIntentosTransversal(
  asignacionId: string,
): Promise<readonly IntentoTransversalParticipanteResponse[]> {
  const respuesta = await httpClient.get<Paginated<IntentoTransversalParticipanteResponse>>(
    `/asignaciones/${asignacionId}/intentos-transversal`,
  )
  return respuesta.data
}

/**
 * `GET /api/v1/intentos-transversal/:intentoId` — variante ADMIN. Devuelve la
 * proyeccion completa con las 3 notas por capa, motivoAnulacion y todos los
 * campos sensibles. El backend ajusta el shape segun el rol del JWT.
 */
export function obtenerIntentoTransversalAdmin(
  intentoId: string,
): Promise<IntentoTransversalAdminResponse> {
  return httpClient.get<IntentoTransversalAdminResponse>(`/intentos-transversal/${intentoId}`)
}

/**
 * `POST /api/v1/intentos-transversal/:intentoId/capas/tests` (E7, admin).
 * Carga la nota + detalle JSON del runner de tests. La api genera el
 * `Idempotency-Key` internamente — un doble click no duplica la carga.
 */
export function cargarCapaTests(input: {
  readonly intentoId: string
  readonly body: CargarCapaTestsInput
}): Promise<IntentoTransversalAdminResponse> {
  return httpClient.post<IntentoTransversalAdminResponse>(
    `/intentos-transversal/${input.intentoId}/capas/tests`,
    input.body,
    { idempotencyKey: crypto.randomUUID() },
  )
}

/**
 * `POST /api/v1/intentos-transversal/:intentoId/capas/cualitativa` (E8, admin).
 * Carga la nota + comentario textual + nivel de confianza del analisis
 * cualitativo del entregable. Idempotente via Idempotency-Key.
 */
export function cargarCapaCualitativa(input: {
  readonly intentoId: string
  readonly body: CargarCapaCualitativaInput
}): Promise<IntentoTransversalAdminResponse> {
  return httpClient.post<IntentoTransversalAdminResponse>(
    `/intentos-transversal/${input.intentoId}/capas/cualitativa`,
    input.body,
    { idempotencyKey: crypto.randomUUID() },
  )
}

/**
 * `POST /api/v1/intentos-transversal/:intentoId/capas/comprension` (E9, admin).
 * Carga la nota + transcripcion de la mini-entrevista de comprension.
 * Idempotente via Idempotency-Key.
 */
export function cargarCapaComprension(input: {
  readonly intentoId: string
  readonly body: CargarCapaComprensionInput
}): Promise<IntentoTransversalAdminResponse> {
  return httpClient.post<IntentoTransversalAdminResponse>(
    `/intentos-transversal/${input.intentoId}/capas/comprension`,
    input.body,
    { idempotencyKey: crypto.randomUUID() },
  )
}

/**
 * `POST /api/v1/intentos-transversal/:intentoId/finalizar` (E10, admin).
 * Cierra la evaluacion: calcula la nota global a partir de las 3 capas,
 * marca `aprobado` y dispara el recalculo de skills del colaborador.
 */
export function finalizarIntentoTransversal(input: {
  readonly intentoId: string
}): Promise<FinalizarTransversalResponse> {
  return httpClient.post<FinalizarTransversalResponse>(
    `/intentos-transversal/${input.intentoId}/finalizar`,
    {},
  )
}

/**
 * `POST /api/v1/intentos-transversal/:intentoId/anular` (E11, admin).
 * Anula el intento (no cuenta para skills). `motivo` viaja en header
 * `X-Motivo` y queda auditado. Idempotente via Idempotency-Key.
 */
export function anularIntentoTransversal(input: {
  readonly intentoId: string
  readonly motivo: string
}): Promise<AnularTransversalResponse> {
  return httpClient.post<AnularTransversalResponse>(
    `/intentos-transversal/${input.intentoId}/anular`,
    {},
    { motivo: input.motivo, idempotencyKey: crypto.randomUUID() },
  )
}
