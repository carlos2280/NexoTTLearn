import type { ModoCursoParticipante } from "@nexott-learn/shared-types"

export interface CalcularSeccionCompletadaInput {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly planCompletada: boolean | undefined
  /**
   * `completada` de `MeAvanceCursoResponse.seccionesEstado` para esta seccion.
   * `undefined` cuando el avance todavia no cargo. Desde la regla unica (#83)
   * el avance cubre todas las secciones del curso, para los dos roles.
   */
  readonly completadaSegunAvance: boolean | undefined
}

/**
 * Decide si una sección del sidebar se pinta como completada (check verde).
 *
 * - `soloLectura` (curso CERRADO) → siempre completada.
 * - `asignado` → el estado por sección del avance, igual que el voluntario
 *   (regla única del avance, #83): cubre TODAS las secciones del curso, también
 *   las que no están en su plan, y sale del mismo cálculo que el contador y el
 *   porcentaje. Mientras el avance no llega, usa `PlanEstudio.completada`. La
 *   apertura sola nunca cuenta (BUG-QA-3).
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
    return completadaSegunAvance ?? planCompletada ?? false
  }
  if (modo === "voluntario") {
    return completadaSegunAvance ?? false
  }
  return false
}
