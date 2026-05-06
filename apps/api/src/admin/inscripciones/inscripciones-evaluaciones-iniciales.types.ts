// Constantes y mensajes del feature de evaluaciones iniciales (schema v2).
// Mensajes en espanol — el frontend los muestra al usuario tal cual.

// biome-ignore lint/nursery/noSecrets: nombre de entidad de dominio, no es un secreto
export const ENTIDAD_TIPO_EVALUACION_INICIAL = "EvaluacionInicial"

export const ERROR_INSCRIPCION_NO_ENCONTRADA = "Inscripcion no encontrada"
export const ERROR_AREA_NO_PERTENECE_AL_CURSO =
  "El area no pertenece al curso de la inscripcion (CursoArea no encontrada)"
export const ERROR_EVALUACION_INICIAL_NO_ENCONTRADA =
  "No existe captura de evaluacion inicial para esta inscripcion y area"
export const ERROR_CURSO_CERRADO_EVAL =
  "No se puede modificar la evaluacion inicial en un curso CERRADO"
export const ERROR_INSCRIPCION_NO_ACTIVA =
  "Solo se pueden capturar evaluaciones iniciales en inscripciones ACTIVAS"
export const ERROR_INSCRIPCION_LIBRE =
  "Las inscripciones LIBRE no admiten evaluacion inicial (MAESTRO §6.3)"
