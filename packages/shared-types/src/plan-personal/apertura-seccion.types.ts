/**
 * Respuesta de `POST /api/v1/asignaciones/:asignacionId/secciones/:seccionId/apertura`
 * (Slice 7 P7c, D94 §9.6).
 *
 * Idempotente por `@@id([asignacionId, seccionId])` en `aperturas_seccion`.
 * Un segundo POST devuelve la misma fila con `yaEstaba=true`. NO audit log
 * (D-S7-D4: la fila AperturaSeccion es el audit funcional).
 */
export interface AperturaSeccionResponse {
  readonly asignacionId: string
  readonly seccionId: string
  readonly primeraAperturaAt: string
  readonly yaEstaba: boolean
}
