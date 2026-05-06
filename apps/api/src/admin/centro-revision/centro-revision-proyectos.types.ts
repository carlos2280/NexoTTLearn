// Constantes y mensajes del Centro de Revision · entregas de proyecto (Iter 9.B).
// MAESTRO §10 (proyectos 3 capas), §12 (centro de revision admin),
// §A25 (flujo evaluación 3 capas), §A26 (ajuste manual con motivo).

export const ENTIDAD_TIPO_ENTREGA_PROYECTO = "EntregaProyecto"

// 404
export const ERROR_ENTREGA_PROYECTO_NO_ENCONTRADA = "Entrega de proyecto no encontrada"

// 500 · invariante XOR violado (BD ya enforce I2)
export const ERROR_PROYECTO_XOR_INVALIDO =
  "Entrega de proyecto inconsistente: debe pertenecer a un Mini Proyecto O un Proyecto Transversal, no a ambos"

// 409 · curso/inscripcion no permiten mutacion
export const ERROR_CURSO_CERRADO_PROYECTO =
  "No se puede modificar la entrega de proyecto: el curso esta CERRADO"
export const ERROR_INSCRIPCION_NO_ACTIVA_EVALUAR_PROYECTO =
  "Solo se pueden evaluar entregas de proyecto de inscripciones ACTIVAS"
export const ERROR_INSCRIPCION_NO_AJUSTABLE_PROYECTO =
  "No se puede ajustar la nota del proyecto: la inscripcion no esta ACTIVA ni COMPLETADA"

// 409 · transiciones invalidas en evaluar
export const ERROR_EVALUAR_PROYECTO_ENVIADA =
  "La entrega de proyecto esta en estado ENVIADA y aun no fue procesada por el sistema"
export const ERROR_EVALUAR_PROYECTO_YA_EVALUADA =
  "La entrega de proyecto ya esta EVALUADA. Para sobrescribir la nota usa el flujo de ajuste manual (A26)"

// 409 · transiciones invalidas en ajustar
export const ERROR_AJUSTAR_PROYECTO_ENVIADA =
  "La entrega de proyecto esta en estado ENVIADA y no se puede ajustar manualmente todavia"

// 500 · pesos snapshot ausentes en ajuste cuando no deberia (D-3 defensivo)
export const ERROR_AJUSTAR_PROYECTO_PESOS_AUSENTES =
  "No se puede ajustar la nota: pesos snapshot ausentes y no se pudieron derivar del proyecto"
