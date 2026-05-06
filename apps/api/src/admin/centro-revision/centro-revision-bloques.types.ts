// Constantes y mensajes del Centro de Revision · entregas de bloque (Iter 9.A).
// MAESTRO §12 (centro de revision admin), §A26 (ajuste manual con motivo).
// Mensajes en espanol — el frontend los muestra al usuario tal cual.

export const ENTIDAD_TIPO_ENTREGA_BLOQUE = "EntregaBloque"

// 404
export const ERROR_ENTREGA_NO_ENCONTRADA = "Entrega de bloque no encontrada"

// 409 · curso/inscripcion no permiten mutacion
export const ERROR_CURSO_CERRADO_ENTREGA = "No se puede modificar la entrega: el curso esta CERRADO"
export const ERROR_INSCRIPCION_NO_ACTIVA_EVALUAR =
  "Solo se pueden evaluar entregas de inscripciones ACTIVAS"
export const ERROR_INSCRIPCION_NO_AJUSTABLE =
  "No se puede ajustar la nota: la inscripcion no esta ACTIVA ni COMPLETADA"

// 409 · transiciones invalidas
export const ERROR_EVALUAR_ESTADO_NO_PENDIENTE =
  "Solo se pueden marcar como EVALUADAS las entregas en estado PENDIENTE_REVISION"
export const ERROR_EVALUAR_YA_EVALUADA =
  "La entrega ya esta EVALUADA. Para sobrescribir la nota usa el flujo de ajuste manual (A26)"
export const ERROR_EVALUAR_AUTOMATICA =
  "La entrega esta EVALUADA_AUTOMATICAMENTE. Para sobrescribir la nota usa el flujo de ajuste manual (A26)"
export const ERROR_EVALUAR_ENVIADA =
  "La entrega esta en estado ENVIADA y aun no fue procesada por el sistema"

export const ERROR_AJUSTAR_ESTADO_ENVIADA =
  "La entrega esta en estado ENVIADA y no se puede ajustar manualmente todavia"
