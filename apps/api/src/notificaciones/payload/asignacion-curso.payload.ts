/**
 * Payload tipado para notificaciones `ASIGNACION_CURSO` (D-S11.5-A1, §19.2/§19.3).
 *
 * Tipo critico — no silenciable. Se emite al colaborador cuando el admin crea
 * una asignacion (rol ASIGNADO) o cuando el propio colaborador se autoinscribe
 * como VOLUNTARIO. Se persiste como JSONB en `notificaciones.payload`. Solo
 * contiene identificadores y el titulo del curso — nada de notas ni datos
 * personales (§19 + R-S10-8 + R-S11.5-3).
 */
export interface AsignacionCursoPayload {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
}

export function esAsignacionCursoPayload(value: unknown): value is AsignacionCursoPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.asignacionId === "string" &&
    typeof candidato.cursoId === "string" &&
    typeof candidato.cursoTitulo === "string"
  )
}
