import type { MeCursoResumen } from "@nexott-learn/shared-types"

const ETIQUETA_ESTADO_ASIGNADO: ReadonlyMap<string, string> = new Map([
  ["ASIGNADO", "Asignado"],
  ["EN_PROGRESO", "En progreso"],
  ["LISTO", "Listo"],
  ["APTO", "Apto"],
  ["NO_APTO", "No apto"],
  ["RETIRADO", "Retirado"],
])

const ETIQUETA_ESTADO_VOLUNTARIO: ReadonlyMap<string, string> = new Map([
  ["INSCRITO", "Inscrito"],
  ["EN_PROGRESO", "En progreso"],
  ["LISTO", "Listo"],
  ["COMPLETADO", "Completado"],
  ["RETIRADO", "Retirado"],
])

/**
 * Texto legible del estado de la asignación combinando rol + estado.
 */
export function etiquetaEstadoAsignacion(asignacion: MeCursoResumen): string {
  if (asignacion.rol === "VOLUNTARIO") {
    return (
      (asignacion.estadoVoluntario &&
        ETIQUETA_ESTADO_VOLUNTARIO.get(asignacion.estadoVoluntario)) ??
      "—"
    )
  }
  return (
    (asignacion.estadoAsignado && ETIQUETA_ESTADO_ASIGNADO.get(asignacion.estadoAsignado)) ?? "—"
  )
}
