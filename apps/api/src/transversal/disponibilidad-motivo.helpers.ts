import type { RazonDisponibilidadTransversal } from "@nexott-learn/shared-types"

/**
 * B-6: copy del campo `motivoBloqueo` en
 * `GET /asignaciones/:id/transversal/disponibilidad`. Centralizado para que
 * el wording sea consistente entre clientes (web, movil) y se actualice
 * desde un solo lugar.
 *
 * Devuelve `null` para razones que implican `disponible === true`. La
 * variante `DESDE_FECHA` interpola la fecha de desbloqueo del curso.
 */
const MOTIVO_BASE: ReadonlyMap<RazonDisponibilidadTransversal, string | null> = new Map([
  ["SIEMPRE", null],
  ["PLAN_COMPLETADO", null],
  ["DESDE_FECHA", null],
  ["BLOQUEADO_PLAN_INCOMPLETO", "Completa tu plan de estudio antes de empezar el transversal."],
])

export function motivoTransversal(
  razon: RazonDisponibilidadTransversal,
  fechaDesbloqueo: Date | null,
): string | null {
  if (razon === "DESDE_FECHA") {
    if (fechaDesbloqueo === null) {
      return "Aun no esta habilitado por fecha."
    }
    return `Disponible desde el ${formatearFechaCorta(fechaDesbloqueo)}.`
  }
  return MOTIVO_BASE.get(razon) ?? null
}

function formatearFechaCorta(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fecha)
}
