/**
 * Slice futuro B (P-B-b) — Visor admin de `consultas_logs` (meta-auditoria).
 *
 * `queryParams` se expone tal cual como JSON arbitrario (Record): el frontend
 * decide como mostrar los filtros segun el `endpoint`. `latenciaMs` puede ser
 * null si el caller no lo midio.
 */

export interface LogConsultaResumen {
  readonly id: string
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly autorEmail: string | null
  readonly autorNombre: string | null
  readonly endpoint: string
  readonly queryParams: Record<string, unknown>
  readonly latenciaMs: number | null
}
