/**
 * Payload tipado para notificaciones `RECORDATORIO_DEADLINE` (D-S11.5-C1).
 *
 * Silenciable. Se emite por el cron diario a colaboradores con asignacion
 * ACTIVA cuyo curso vence en T+7 o T+1. Se persiste como JSONB en
 * `notificaciones.payload`. Solo IDs + titulo del curso y la ventana — sin
 * notas, sin datos personales (§19 + R-S10-8 + R-S11.5-3).
 *
 * `diasRestantes` es discriminado (7 | 1) para que la plantilla elija el copy
 * correcto y para que en metricas se puedan distinguir las dos ventanas.
 */
export interface RecordatorioDeadlinePayload {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaDeadline: string
  readonly diasRestantes: 7 | 1
}

export function esRecordatorioDeadlinePayload(
  value: unknown,
): value is RecordatorioDeadlinePayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  if (
    typeof candidato.asignacionId !== "string" ||
    typeof candidato.cursoId !== "string" ||
    typeof candidato.cursoTitulo !== "string" ||
    typeof candidato.fechaDeadline !== "string"
  ) {
    return false
  }
  return candidato.diasRestantes === 7 || candidato.diasRestantes === 1
}
