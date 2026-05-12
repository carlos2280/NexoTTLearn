import type { CanalNotif, TipoEventoNotif } from "./tipo-evento"

/**
 * Forma resumida devuelta por `GET /api/v1/notificaciones` (listado).
 *
 * Decision D-S10-C6: el listado NO incluye `payload`, `canalesEnviados` ni
 * `errorCorreo` — solo metadatos suficientes para renderizar el item del
 * dropdown. El cliente carga el detalle (`NotificacionResponse`) en demanda.
 */
export interface NotificacionResumen {
  readonly id: string
  readonly tipoEvento: TipoEventoNotif
  readonly esCritico: boolean
  readonly fechaCreacion: string
  readonly leida: boolean
  readonly fechaLeida: string | null
  readonly archivada: boolean
}

/**
 * Forma completa devuelta por `GET /api/v1/notificaciones/:id` (detalle).
 *
 * `payload` se devuelve sin discriminar shape — el cliente lo interpreta segun
 * `tipoEvento` consultando las definiciones de payload (P10a).
 */
export interface NotificacionResponse {
  readonly id: string
  readonly tipoEvento: TipoEventoNotif
  readonly esCritico: boolean
  readonly payload: Record<string, unknown>
  readonly fechaCreacion: string
  readonly leida: boolean
  readonly fechaLeida: string | null
  readonly archivada: boolean
  readonly canalesEnviados: readonly CanalNotif[]
  readonly errorCorreo: string | null
}

/**
 * Forma devuelta por `GET /api/v1/notificaciones/badge` (campanita).
 */
export interface NotificacionBadgeResponse {
  readonly noLeidas: number
}

/**
 * Forma devuelta por `GET /api/v1/notificaciones/preferencias`.
 *
 * `tiposCriticos` se devuelve solo informativamente (D-S10-C7). El cliente lo
 * usa para deshabilitar checkboxes en la UI; el backend rechaza con 422
 * cualquier intento de silenciar uno de estos tipos.
 */
export interface PreferenciasNotificacionResponse {
  readonly silenciados: readonly TipoEventoNotif[]
  readonly tiposCriticos: readonly TipoEventoNotif[]
}
