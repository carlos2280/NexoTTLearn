/**
 * Payload tipado para notificaciones `COLABORADOR_LISTO` (D-S11.5-B1, §19.2/§19.3).
 *
 * Tipo silenciable — el admin puede silenciarlo via
 * `PATCH /me/preferencias-notificacion`. Se emite a TODOS los admins activos
 * (broadcast via `broadcastAdminsActivos`) cuando `asignaciones.service.marcarListo`
 * transiciona una asignacion `EN_PROGRESO -> LISTO`.
 *
 * Solo contiene identificadores + titulo del curso + nombre del colaborador
 * (que ya conoce el admin) — nada de notas ni datos personales sensibles
 * (§19 + R-S10-8 + R-S11.5-3 + R-S11.5-10).
 */
export interface ColaboradorListoPayload {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly colaboradorId: string
  readonly colaboradorNombre: string
}

export function esColaboradorListoPayload(value: unknown): value is ColaboradorListoPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.asignacionId === "string" &&
    typeof candidato.cursoId === "string" &&
    typeof candidato.cursoTitulo === "string" &&
    typeof candidato.colaboradorId === "string" &&
    typeof candidato.colaboradorNombre === "string"
  )
}
