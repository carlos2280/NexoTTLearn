/**
 * Indica qué modalidades de evaluación tiene configuradas un curso. Lo consume
 * el PanelEvaluaciones del admin para renderizar solo los subtabs aplicables.
 *
 * - `tieneEntrevistaIa`: existe `Curso.entrevistaIaId`.
 * - `tieneTransversal`: existe `Curso.transversalId`.
 * - `tieneBloquesEvaluables`: existe al menos un `Bloque` con `esEvaluable=true`
 *   en alguna sección de los módulos del curso.
 */
export interface EvaluacionesDisponibles {
  readonly tieneEntrevistaIa: boolean
  readonly tieneTransversal: boolean
  readonly tieneBloquesEvaluables: boolean
}
