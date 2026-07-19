import { bloquesVisibles, construirPermutacionConOcultos } from "./reordenar-bloques"
import type { SeccionConBloques } from "./types"

// Prefijos de id para distinguir tipo de item en los drag events del arbol.
export const PREFIX_SEC = "sec:"
export const PREFIX_BLQ = "blq:"

/** Orden final de secciones que se persiste tras un reordenamiento. */
export type OrdenSecciones = ReadonlyArray<{ readonly seccionId: string; readonly orden: number }>

/** Orden final de bloques (cubre todos los de la seccion, contrato del backend). */
export type OrdenBloques = ReadonlyArray<{ readonly bloqueId: string; readonly orden: number }>

/** Orden final de bloques dentro de la seccion afectada. */
export interface ReordenBloques {
  readonly seccionId: string
  readonly permutacion: OrdenBloques
}

/**
 * Calcula la nueva permutacion de secciones al soltar `activeId` sobre `overId`.
 * Devuelve `null` si el drag no es entre dos secciones o si el orden no cambia.
 */
export function permutarSecciones(
  arbol: readonly SeccionConBloques[],
  activeId: string,
  overId: string,
): OrdenSecciones | null {
  if (!(activeId.startsWith(PREFIX_SEC) && overId.startsWith(PREFIX_SEC))) {
    return null
  }
  const ids = arbol.map((item) => item.seccion.id)
  const from = ids.indexOf(activeId.slice(PREFIX_SEC.length))
  const to = ids.indexOf(overId.slice(PREFIX_SEC.length))
  if (from < 0 || to < 0 || from === to) {
    return null
  }
  const siguiente = [...ids]
  const [extraido] = siguiente.splice(from, 1)
  if (!extraido) {
    return null
  }
  siguiente.splice(to, 0, extraido)
  return siguiente.map((seccionId, idx) => ({ seccionId, orden: idx + 1 }))
}

/**
 * Calcula la nueva permutacion de bloques al soltar `activeId` sobre `overId`.
 * Solo reordena dentro de la misma seccion (no cross-section). Devuelve `null`
 * si el drag no es entre dos bloques, si cruza secciones, o si el orden no cambia.
 * Los bloques ocultos (CODIGO_TESTS/SQL_TESTS) viajan pegados a su reto.
 */
export function permutarBloques(
  arbol: readonly SeccionConBloques[],
  activeId: string,
  overId: string,
): ReordenBloques | null {
  if (!(activeId.startsWith(PREFIX_BLQ) && overId.startsWith(PREFIX_BLQ))) {
    return null
  }
  const aBId = activeId.slice(PREFIX_BLQ.length)
  const oBId = overId.slice(PREFIX_BLQ.length)
  const seccionDelActive = arbol.find((it) => it.bloques.some((b) => b.id === aBId))
  const seccionDelOver = arbol.find((it) => it.bloques.some((b) => b.id === oBId))
  if (!seccionDelActive || seccionDelActive !== seccionDelOver) {
    return null
  }
  const ids = bloquesVisibles(seccionDelActive.bloques).map((b) => b.id)
  const from = ids.indexOf(aBId)
  const to = ids.indexOf(oBId)
  if (from < 0 || to < 0 || from === to) {
    return null
  }
  const siguiente = [...ids]
  const [extraido] = siguiente.splice(from, 1)
  if (!extraido) {
    return null
  }
  siguiente.splice(to, 0, extraido)
  const permutacion = construirPermutacionConOcultos(seccionDelActive.bloques, siguiente)
  return { seccionId: seccionDelActive.seccion.id, permutacion }
}
