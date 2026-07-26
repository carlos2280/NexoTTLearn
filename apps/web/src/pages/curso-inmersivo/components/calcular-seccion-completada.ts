import type { ModoCursoParticipante } from "@nexott-learn/shared-types"

export interface CalcularSeccionCompletadaInput {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly planCompletada: boolean | undefined
  /**
   * `completada` de `MeAvanceCursoResponse.seccionesEstado` para esta seccion.
   * `undefined` cuando el avance todavia no cargo o la seccion no entra en el
   * calculo (por ejemplo una opcional fuera del plan del asignado).
   */
  readonly completadaSegunAvance: boolean | undefined
}

/**
 * Decide si una sección del sidebar se pinta como completada (check verde).
 *
 * - `soloLectura` (curso CERRADO) → siempre completada.
 * - `asignado` → `PlanEstudio.completada`. La apertura sola no cuenta: el
 *   contador del header usa `plan.avance.seccionesCompletadas` y marcar verde
 *   por apertura genera la contradicción "9/22" con 22 checks (BUG-QA-3 del
 *   informe QA viaje-colaborador 2026-05-17).
 * - `voluntario` → no hay plan personal (D-AS-1), así que usa el estado por
 *   sección del avance, que aplica la MISMA regla que el plan del asignado.
 *   Antes se pintaba por `AperturaSeccion` (recorrido) mientras el backend ya
 *   medía por dominio: el voluntario veía todo en verde conviviendo con un
 *   porcentaje menor al 100% y un transversal bloqueado sin explicación (P28).
 * - `preview` → nunca completada (catálogo en lectura sin progreso).
 *
 * Ante la duda (avance aún sin cargar) devuelve `false`: es preferible no
 * marcar todavía que afirmar un logro que no ocurrió.
 */
export function calcularSeccionCompletada({
  modo,
  soloLectura,
  planCompletada,
  completadaSegunAvance,
}: CalcularSeccionCompletadaInput): boolean {
  if (soloLectura) {
    return true
  }
  if (modo === "asignado") {
    return planCompletada ?? false
  }
  if (modo === "voluntario") {
    return completadaSegunAvance ?? false
  }
  return false
}
