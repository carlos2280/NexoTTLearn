import type { BloqueResponse, TipoBloque } from "@nexott-learn/shared-types"

/**
 * Tipos de bloque que NO se muestran sueltos en el arbol del builder: se editan
 * anidados dentro de otro bloque. Hoy solo `CODIGO_TESTS`, que se edita dentro
 * de su Reto de codigo (seccion "Tests automaticos"). Siguen existiendo como
 * bloques propios en la BD; solo se ocultan de la vista.
 *
 * `SQL_TESTS` es su espejo estructural (bloque auxiliar pareado a su ejercicio,
 * oculto al participante junto con `CODIGO_TESTS`). NO se incluye aun porque su
 * editor todavia no esta embebido en el canvas del admin (cae al placeholder
 * "proximamente"); ocultarlo lo dejaria ineditable. Añadir `"SQL_TESTS"` aqui
 * cuando exista el editor SQL embebido (pendiente de los editores SQL).
 */
const TIPOS_OCULTOS: ReadonlySet<TipoBloque> = new Set<TipoBloque>(["CODIGO_TESTS"])

/** Un bloque se oculta del arbol si su tipo se edita anidado en otro bloque. */
export function esBloqueOculto(bloque: BloqueResponse): boolean {
  return TIPOS_OCULTOS.has(bloque.tipo)
}

/** Bloques que SI se pintan como fila propia en el arbol (sin los ocultos). */
export function bloquesVisibles(bloques: readonly BloqueResponse[]): readonly BloqueResponse[] {
  return bloques.filter((bloque) => !esBloqueOculto(bloque))
}

/**
 * Reconstruye la permutacion COMPLETA de una seccion (el backend exige que
 * cubra todos los bloques, `bloqueOrdenInvalido`) a partir del nuevo orden de
 * solo los bloques visibles.
 *
 * Cada bloque oculto viaja pegado a su "ancla": el ultimo bloque visible que lo
 * precede en el orden original (al auto-crear el par, el CODIGO_TESTS queda
 * justo despues de su Reto, asi que el ancla es su reto). Los ocultos sin ancla
 * previa —caso raro/legacy— se preservan al inicio en su orden original.
 *
 * Precondiciones:
 * - `bloquesOrdenActual` esta ordenado por `orden` asc (asi lo entrega el arbol).
 * - `ordenVisibleIds` es una permutacion de TODOS los bloques visibles (no un
 *   subconjunto): si faltara un ancla visible, sus ocultos se caerian de la
 *   permutacion y el backend la rechazaria con `bloqueOrdenInvalido`.
 */
export function construirPermutacionConOcultos(
  bloquesOrdenActual: readonly BloqueResponse[],
  ordenVisibleIds: readonly string[],
): ReadonlyArray<{ readonly bloqueId: string; readonly orden: number }> {
  const ocultosPorAncla = new Map<string, BloqueResponse[]>()
  const ocultosSinAncla: BloqueResponse[] = []
  let anclaActual: string | null = null

  for (const bloque of bloquesOrdenActual) {
    if (esBloqueOculto(bloque)) {
      if (anclaActual === null) {
        ocultosSinAncla.push(bloque)
      } else {
        const lista = ocultosPorAncla.get(anclaActual) ?? []
        lista.push(bloque)
        ocultosPorAncla.set(anclaActual, lista)
      }
    } else {
      anclaActual = bloque.id
    }
  }

  const permutacion: Array<{ bloqueId: string; orden: number }> = []
  let orden = 1
  for (const oculto of ocultosSinAncla) {
    permutacion.push({ bloqueId: oculto.id, orden: orden++ })
  }
  for (const visibleId of ordenVisibleIds) {
    permutacion.push({ bloqueId: visibleId, orden: orden++ })
    for (const oculto of ocultosPorAncla.get(visibleId) ?? []) {
      permutacion.push({ bloqueId: oculto.id, orden: orden++ })
    }
  }
  return permutacion
}
