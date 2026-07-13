/**
 * Payload tipado para notificaciones `TRANSVERSAL_POR_REVISAR` (Fase 4b).
 *
 * Tipo silenciable — el admin puede silenciarlo via
 * `PATCH /me/preferencias-notificacion`. Se emite a TODOS los admins activos
 * (broadcast via `broadcastAdminsActivos`) cuando un intento transversal pasa a
 * estado `EVALUADO` (la IA terminó; falta que un admin lo cure/finalice).
 *
 * `NotificacionesService.crear()` hace un INSERT por evento (no upsert): cada
 * transición a EVALUADO genera un aviso propio, con `intentoTransversalId`
 * apuntando a ESE intento (deep-link accionable a su detalle). No hay
 * deduplicación: N intentos evaluados ⇒ N avisos por admin (aceptable al volumen
 * MVP de transversales). Solo identificadores + título del curso + nombre del
 * colaborador que el admin ya conoce — nada de notas ni feedback (§19 + R-S10-8).
 */
export interface TransversalPorRevisarPayload {
  readonly intentoTransversalId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly colaboradorNombre: string
}

export function esTransversalPorRevisarPayload(
  value: unknown,
): value is TransversalPorRevisarPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.intentoTransversalId === "string" &&
    typeof candidato.cursoId === "string" &&
    typeof candidato.cursoTitulo === "string" &&
    typeof candidato.colaboradorNombre === "string"
  )
}
