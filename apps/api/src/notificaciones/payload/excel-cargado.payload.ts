/**
 * Payload tipado para notificaciones `EXCEL_CARGADO` (D-S11.5-B2, §19.2/§19.3).
 *
 * Tipo critico — no silenciable (operativo). Se emite SOLO al admin actor que
 * disparo la carga (no broadcast). Confirma que la aplicacion del preview
 * termino exitosamente con un resumen agregado de la operacion.
 *
 * Solo contiene identificadores y contadores agregados — no incluye listas de
 * colaboradores ni notas concretas (§19 + R-S11.5-10).
 */
export interface ExcelCargadoPayload {
  readonly cursoId: string
  readonly cargaId: string
  readonly skillsActualizadas: number
  readonly colaboradoresActualizados: number
  readonly planesMarcadosDesactualizados: number
}

export function esExcelCargadoPayload(value: unknown): value is ExcelCargadoPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.cursoId === "string" &&
    typeof candidato.cargaId === "string" &&
    typeof candidato.skillsActualizadas === "number" &&
    typeof candidato.colaboradoresActualizados === "number" &&
    typeof candidato.planesMarcadosDesactualizados === "number"
  )
}
