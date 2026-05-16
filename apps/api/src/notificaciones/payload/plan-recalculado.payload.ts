/**
 * Payload tipado para notificaciones `PLAN_RECALCULADO` (D-S10-A5).
 *
 * Se persiste como JSONB en `notificaciones.payload`. Solo contiene identificadores
 * y el titulo del curso — nada de datos personales ni notas (§19 + R-S10-8).
 */
export interface PlanRecalculadoPayload {
  readonly planId: string
  readonly asignacionId: string
  readonly cursoTitulo: string
}

export function esPlanRecalculadoPayload(value: unknown): value is PlanRecalculadoPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.planId === "string" &&
    typeof candidato.asignacionId === "string" &&
    typeof candidato.cursoTitulo === "string"
  )
}
