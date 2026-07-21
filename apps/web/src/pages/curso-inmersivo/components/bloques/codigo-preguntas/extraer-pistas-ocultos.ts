import type { ResultadoTestUI } from "@/features/codigo-ejecucion"

export interface PistaOculta {
  readonly testId: string
  /** Texto crudo de la `descripcion` del test (puede venir como HTML de Tiptap;
   * el componente lo pasa por `extraerTextoPlano` antes de mostrarlo). */
  readonly texto: string
}

/**
 * De los resultados de una ejecución, devuelve las descripciones de los tests
 * OCULTOS que fallaron, para mostrarlas como pista al participante SIN revelar
 * su entrada ni su salida esperada. Descarta los ocultos sin descripción.
 * Preserva el orden original. Función pura, testeable sin DOM.
 */
export function extraerPistasOcultos(
  resultados: readonly ResultadoTestUI[],
): readonly PistaOculta[] {
  return resultados
    .filter((r) => !(r.visible || r.paso) && r.descripcion.trim().length > 0)
    .map((r) => ({ testId: r.testId, texto: r.descripcion }))
}
