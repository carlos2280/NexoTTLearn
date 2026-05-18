import type { ModoCursoParticipante } from "@nexott-learn/shared-types"

export interface CalcularSeccionCompletadaInput {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly planCompletada: boolean | undefined
  readonly abiertaPorAperturas: boolean
}

/**
 * Decide si una sección del sidebar se pinta como completada (check verde).
 *
 * - `soloLectura` (curso CERRADO) → siempre completada.
 * - `asignado` → solo si `PlanEstudio.completada === true`. La apertura sola
 *   no cuenta: el contador del header usa `plan.avance.seccionesCompletadas`
 *   y marcar verde por apertura genera la contradicción "9/22" con 22 checks
 *   (BUG-QA-3 del informe QA viaje-colaborador 2026-05-17).
 * - `voluntario` → no hay plan personal (D-AS-1); cuenta como completada
 *   cuando hay `AperturaSeccion` registrada.
 * - `preview` → nunca completada (catálogo en lectura sin progreso).
 */
export function calcularSeccionCompletada({
  modo,
  soloLectura,
  planCompletada,
  abiertaPorAperturas,
}: CalcularSeccionCompletadaInput): boolean {
  if (soloLectura) {
    return true
  }
  if (modo === "asignado") {
    return planCompletada ?? false
  }
  if (modo === "voluntario") {
    return abiertaPorAperturas
  }
  return false
}
