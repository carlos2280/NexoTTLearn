/**
 * Payload tipado para notificaciones `CURSO_DEADLINE` (D-S11-A9, D-S11-C9).
 *
 * Se persiste como JSONB en `notificaciones.payload`. Solo contiene
 * identificadores y datos no sensibles del curso — sin notas ni datos
 * personales del participante (§19 + R-S10-8).
 */
export interface CursoDeadlinePayload {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaDeadline: string
}

export function esCursoDeadlinePayload(value: unknown): value is CursoDeadlinePayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.cursoId === "string" &&
    typeof candidato.cursoTitulo === "string" &&
    typeof candidato.fechaDeadline === "string"
  )
}
