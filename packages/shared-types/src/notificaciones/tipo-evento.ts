/**
 * Catalogo D88 de tipos de evento de notificacion (Slice 10).
 *
 * Replicado aqui como union literal porque `@nexott-learn/shared-types` no
 * puede importar `@prisma/client` (regla del paquete). Los valores deben
 * coincidir 1-a-1 con el enum `TipoEventoNotif` del schema Prisma — el backend
 * castea entre ambos sin transformacion.
 */
export const TIPOS_EVENTO_NOTIF = [
  "ASIGNACION_CURSO",
  "PLAN_RECALCULADO",
  "TRANSVERSAL_DISPONIBLE",
  "ENTREVISTA_IA_DISPONIBLE",
  "RECORDATORIO_DEADLINE",
  "CASO_REABIERTO",
  "RESULTADO_CIERRE",
  "CURSO_DEADLINE",
  "COLABORADOR_LISTO",
  "EXCEL_CARGADO",
  "MODULO_HUERFANO_SKILL",
  "PLANES_DESACTUALIZADOS",
  "CENTRO_REVISION",
] as const

export type TipoEventoNotif = (typeof TIPOS_EVENTO_NOTIF)[number]

/**
 * Tipos criticos del catalogo D88 (§19.3 punto 1).
 *
 * El backend siempre los emite ignorando preferencias silenciadas; el contrato
 * HTTP los devuelve en `GET /notificaciones/preferencias` para que el cliente
 * muestre los checkboxes deshabilitados.
 */
export const TIPOS_CRITICOS_NOTIF: readonly TipoEventoNotif[] = [
  "ASIGNACION_CURSO",
  "CASO_REABIERTO",
  "RESULTADO_CIERRE",
  "EXCEL_CARGADO",
  "MODULO_HUERFANO_SKILL",
]

export const CANALES_NOTIF = ["IN_APP", "CORREO"] as const

export type CanalNotif = (typeof CANALES_NOTIF)[number]
