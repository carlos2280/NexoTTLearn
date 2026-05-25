export {
  TIPOS_EVENTO_NOTIF,
  TIPOS_CRITICOS_NOTIF,
  CANALES_NOTIF,
} from "./tipo-evento"
export type { TipoEventoNotif, CanalNotif } from "./tipo-evento"

export type {
  NotificacionResumen,
  NotificacionResponse,
  NotificacionBadgeResponse,
  PreferenciasNotificacionResponse,
} from "./notificacion.types"

export { listarNotificacionesQuerySchema } from "./listar-notificaciones.schema"
export type { ListarNotificacionesQuery } from "./listar-notificaciones.schema"

export { patchPreferenciasNotificacionSchema } from "./patch-preferencias.schema"
export type { PatchPreferenciasNotificacionInput } from "./patch-preferencias.schema"
