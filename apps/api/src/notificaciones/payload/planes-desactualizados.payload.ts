/**
 * Payload tipado para notificaciones `PLANES_DESACTUALIZADOS` (D-S11.5-B3,
 * D80, §19.2/§19.3).
 *
 * Tipo silenciable. Se emite via broadcast a todos los admins activos cuando
 * uno o mas planes de estudio quedan marcados `estaDesactualizado=true`. El
 * driver discrimina la causa para que la plantilla pueda renderizar copy
 * apropiado:
 *
 *  - `recarga_excel`: aplicacion de un preview que actualiza notas y marca N
 *    planes desactualizados (`AplicarService.aplicar` -> §6 driver D80).
 *  - `reabrir_caso`: reapertura individual (`asignaciones.service.reabrirCaso`)
 *    que marca el plan de la asignacion reabierta como desactualizado.
 *
 * Solo contiene `driver`, `cursoId` y `planesAfectados` agregados (§19 +
 * R-S11.5-10). El detalle por colaborador NO viaja en el payload — el admin
 * lo consulta en la app si lo necesita.
 */
export type PlanesDesactualizadosDriver = "recarga_excel" | "reabrir_caso"

export interface PlanesDesactualizadosPayload {
  readonly driver: PlanesDesactualizadosDriver
  readonly cursoId: string
  readonly planesAfectados: number
}

export function esPlanesDesactualizadosPayload(
  value: unknown,
): value is PlanesDesactualizadosPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    (candidato.driver === "recarga_excel" || candidato.driver === "reabrir_caso") &&
    typeof candidato.cursoId === "string" &&
    typeof candidato.planesAfectados === "number"
  )
}
