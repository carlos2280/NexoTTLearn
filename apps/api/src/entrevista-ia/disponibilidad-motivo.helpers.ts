import type { RazonDisponibilidadEntrevistaIa } from "@nexott-learn/shared-types"

/**
 * B-6: copy del campo `motivoBloqueo` en
 * `GET /asignaciones/:id/entrevista-ia/disponibilidad`. Mismo patron que
 * el helper del transversal: un solo punto de cambio para el wording
 * que ven los participantes.
 *
 * `RATE_LIMIT_HORA` no incluye "Vuelve en N minutos" (D-S8-D3): el
 * servicio actual no rastrea la fecha del primer intento de la ventana,
 * solo el conteo. Si en el futuro se quiere precision, hay que extender
 * `contarIntentosUltimaHora` para devolver tambien la fecha mas antigua.
 */
const MOTIVO_BASE: ReadonlyMap<RazonDisponibilidadEntrevistaIa, string | null> = new Map([
  ["DISPONIBLE", null],
  ["PLAN_INCOMPLETO", "Completa primero tu plan de estudio."],
  ["TRANSVERSAL_NO_APROBADO", "Aprueba primero el transversal."],
  ["FECHA_NO_ALCANZADA", null],
  ["RATE_LIMIT_HORA", "Has usado tus 5 intentos de esta hora. Vuelve mas tarde."],
  ["INTENTO_EN_CURSO", "Tienes un intento en curso. Termina ese primero."],
  ["ENTREVISTA_IA_NO_CONFIGURADA", "Este curso aun no tiene entrevista IA configurada."],
])

export function motivoEntrevistaIa(
  razon: RazonDisponibilidadEntrevistaIa,
  fechaDesbloqueo: Date | null,
): string | null {
  if (razon === "FECHA_NO_ALCANZADA") {
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
