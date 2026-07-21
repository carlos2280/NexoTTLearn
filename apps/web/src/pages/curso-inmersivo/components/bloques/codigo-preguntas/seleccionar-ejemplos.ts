import type { TestStdinStdout } from "@nexott-learn/shared-types"

export interface EjemploVisible {
  readonly id: string
  /** I/O literal del test: se renderiza verbatim (monospace, `whitespace-pre`),
   *  NUNCA se pasa por `extraerTextoPlano` — colapsaría whitespace de stdin. */
  readonly entrada: string
  readonly salidaEsperada: string
  /** Texto libre del autor; puede venir como HTML de Tiptap → el componente lo
   *  sanea con `extraerTextoPlano` antes de mostrarlo. */
  readonly descripcion: string
}

/**
 * Selecciona los tests que pueden mostrarse como ejemplos al participante:
 * únicamente los `visible === true`. Los ocultos (`visible === false`) nunca se
 * exponen aquí — su entrada/salida es secreta para evitar que se hardcodee la
 * respuesta. Preserva el orden original. Función pura (sin DOM), testeable.
 */
export function seleccionarEjemplos(tests: readonly TestStdinStdout[]): readonly EjemploVisible[] {
  return tests
    .filter((t) => t.visible)
    .map((t) => ({
      id: t.id,
      entrada: t.entrada,
      salidaEsperada: t.salidaEsperada,
      descripcion: t.descripcion,
    }))
}
