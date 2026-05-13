/**
 * Payload tipado para notificaciones `CENTRO_REVISION` (D-S11.5-C3).
 *
 * Silenciable. Se emite por el cron diario (broadcast a admins activos) si el
 * Centro de revision tiene >= 1 pendientes. Se persiste como JSONB en
 * `notificaciones.payload`. Solo contadores agregados + fecha de corte — sin
 * IDs de intentos, sin datos del colaborador (§19 + R-S10-8 + R-S11.5-10).
 *
 * `porTipo` desagrega los pendientes para que el admin entienda el peso de
 * cada cola (transversales por capas pendientes, entrevistas IA por ajuste
 * admin pendiente).
 */
export interface CentroRevisionPayload {
  readonly totalPendientes: number
  readonly porTipo: {
    readonly transversales: number
    readonly entrevistasIa: number
  }
  readonly fechaCorte: string
}

export function esCentroRevisionPayload(value: unknown): value is CentroRevisionPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  if (typeof candidato.totalPendientes !== "number" || typeof candidato.fechaCorte !== "string") {
    return false
  }
  const porTipo = candidato.porTipo
  if (typeof porTipo !== "object" || porTipo === null) {
    return false
  }
  const detalle = porTipo as Record<string, unknown>
  return typeof detalle.transversales === "number" && typeof detalle.entrevistasIa === "number"
}
