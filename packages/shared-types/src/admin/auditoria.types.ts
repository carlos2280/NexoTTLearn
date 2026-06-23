/**
 * Slice 12 (P12) — Visor de auditoria `activity_logs`.
 *
 * Tipos compartidos entre `api` y `web` para el visor admin de auditoria
 * (D-S12-A3). Los strings literales de `AccionAuditoriaLiteral` se mantienen
 * en sincronia manual con el enum Prisma `accion_auditoria_enum`. Cualquier
 * cambio aditivo al enum requiere migracion SQL + actualizacion de este array
 * (D-S12-D1). Es el mismo trade-off heredado por la decision shared-types §3
 * (sin import de @prisma/client).
 */

export const ACCIONES_AUDITORIA = [
  "LOGIN_OK",
  "LOGIN_FAIL",
  "LOGOUT",
  "PASSWORD_CHANGED",
  "PASSWORD_REGENERATED",
  "USUARIO_DESBLOQUEADO",
  "USUARIO_ROL_CAMBIADO",
  "SESION_ELIMINADA",
  "COLABORADOR_CREADO",
  "AVISO_ACEPTADO",
  "LOGIN_PARCIAL_OK",
  "MFA_SETUP_INICIADO",
  "MFA_ENABLED",
  "MFA_VERIFY_OK",
  "MFA_VERIFY_FAIL",
  "MFA_DISABLED",
  "AREA_CREADA",
  "AREA_ACTUALIZADA",
  "AREA_ELIMINADA",
  "SKILL_CREADA",
  "SKILL_RENOMBRADA",
  "SKILL_ARCHIVADA",
  "SKILL_DESARCHIVADA",
  "SKILL_ELIMINADA",
  "SKILL_CAMBIO_AREA",
  "SKILL_FUSIONADA",
  "MODULO_CREADO",
  "MODULO_ACTUALIZADO",
  "MODULO_ARCHIVADO",
  "MODULO_DESARCHIVADO",
  "MODULO_ELIMINADO",
  "MODULO_HUERFANO_DETECTADO",
  "SECCION_CREADA",
  "SECCION_ACTUALIZADA",
  "SECCION_REORDENADA",
  "SECCION_ELIMINADA",
  "BLOQUE_CREADO",
  "BLOQUE_EDITADO_COSMETICO",
  "BLOQUE_EDITADO_EVALUACION",
  "BLOQUE_REORDENADO",
  "BLOQUE_ELIMINADO_SOFT",
  "CLIENTE_CREADO",
  "CLIENTE_ACTUALIZADO",
  "CLIENTE_ELIMINADO",
  "EVALUACION_TEMPLATE_DESCARGADO",
  "EVALUACION_PREVIEW_CREADO",
  "EVALUACION_PREVIEW_DESCARTADO",
  "EVALUACION_APLICADA",
  "NOTA_SKILL_EDITADA_MANUALMENTE",
  "ASIGNACION_CREADA",
  "ASIGNACION_CONVERTIDA",
  "ASIGNACION_INICIADA",
  "ASIGNACION_LISTA",
  "ASIGNACION_CERRADA",
  "ASIGNACION_REABIERTA",
  "ASIGNACION_RETIRADA",
  "RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO",
  "VOLUNTARIO_AUTOINSCRITO",
  "PLAN_RECALCULADO",
  "PLAN_AJUSTADO_MANUALMENTE",
  "INTENTO_BLOQUE_INVALIDADO",
  "INTENTO_TRANSVERSAL_CREADO",
  "INTENTO_TRANSVERSAL_FINALIZADO",
  "INTENTO_TRANSVERSAL_ANULADO",
  "INTENTO_TRANSVERSAL_CAPA_CARGADA",
  "TRANSVERSAL_SKILLS_ACTUALIZADAS",
  "INTENTO_ENTREVISTA_IA_CREADO",
  "INTENTO_ENTREVISTA_IA_FINALIZADO",
  "INTENTO_ENTREVISTA_IA_AJUSTADO",
  "INTENTO_ENTREVISTA_IA_ANULADO",
  "PREFERENCIA_NOTIFICACION_ACTUALIZADA",
  "CURSO_CERRADO",
  "CURSO_CIERRE_DESHECHO",
  "FICHA_EXPORTADA",
  "PLAN_RECALCULADO_MASIVO",
  "AUDITORIA_EXPORTADA",
  "LOGS_EXPORTADO",
] as const

export type AccionAuditoriaLiteral = (typeof ACCIONES_AUDITORIA)[number]

/**
 * Resumen de una entrada de `activity_logs` proyectado para el visor admin
 * (D-S12-A3). Incluye el join LEFT con `Usuario` (`actorEmail`) y `Colaborador`
 * (`actorNombre`) cuando `usuarioId` no es null. Para eventos de sistema/cron
 * (`usuarioId = null`), todos los campos derivados del actor son null.
 *
 * NO incluye `requestId` ni columnas sensibles; el visor expone solo lo que
 * el admin necesita para inspeccion forense (OWASP A09).
 */
export interface AuditoriaResumen {
  readonly id: string
  readonly actorUsuarioId: string | null
  readonly actorEmail: string | null
  readonly actorNombre: string | null
  readonly accion: AccionAuditoriaLiteral
  readonly recursoTipo: string | null
  readonly recursoId: string | null
  readonly exito: boolean
  readonly metadata: Record<string, unknown> | null
  readonly ip: string | null
  readonly userAgent: string | null
  readonly createdAt: string
}
