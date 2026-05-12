/**
 * Payload tipado para notificaciones `TRANSVERSAL_DISPONIBLE` (D-S11.5-A3,
 * D42, §19.2/§19.3).
 *
 * Tipo silenciable (D42) — el colaborador puede silenciarlo via
 * `PATCH /me/preferencias-notificacion`. Se emite SOLO la primera vez que el
 * colaborador inicia un intento de proyecto transversal en una asignacion
 * (transicion conceptual `null -> EN_PROGRESO`). La idempotencia
 * inter-intentos garantiza que reintentos posteriores no re-emitan
 * (R-S11.5-1).
 *
 * Solo contiene identificadores y el titulo del curso (§19 + R-S10-8 +
 * R-S11.5-3).
 */
export interface TransversalDisponiblePayload {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly intentoTransversalId: string
}

export function esTransversalDisponiblePayload(
  value: unknown,
): value is TransversalDisponiblePayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.asignacionId === "string" &&
    typeof candidato.cursoId === "string" &&
    typeof candidato.cursoTitulo === "string" &&
    typeof candidato.intentoTransversalId === "string"
  )
}
