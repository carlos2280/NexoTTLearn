import type { PreguntaQuiz } from "@nexott-learn/shared-types"

/**
 * Orden en que se le muestran las preguntas del quiz al participante.
 *
 * - `ordenAleatorio=false` → respeta el orden que fijó el admin (identidad).
 * - `ordenAleatorio=true` → baraja de forma DETERMINISTA y ESTABLE por
 *   participante: a cada pregunta se le asigna una clave `hash(semilla + id)` y
 *   se ordena por ella. El mismo participante ve SIEMPRE el mismo orden en ese
 *   bloque (entre recargas, re-renders y modo revisión P13); participantes
 *   distintos ven órdenes distintos.
 *
 * Por qué no `Math.random()` ni `sort(() => Math.random() - 0.5)`: el primero
 * re-baraja en cada render (marea al alumno y descuadra la revisión); el segundo
 * ni siquiera es un shuffle uniforme. Asignar una clave i.i.d. por elemento y
 * ordenar por ella SÍ produce una permutación uniforme, y al derivar la clave de
 * un hash estable el orden queda fijo sin persistir nada.
 *
 * La `semilla` debe ser estable por participante+bloque (p. ej.
 * `colaboradorId + bloqueId`), no global, para que cada alumno reciba su propio
 * orden. Función pura: no muta la entrada.
 */
export function ordenarPreguntasQuiz(
  preguntas: readonly PreguntaQuiz[],
  ordenAleatorio: boolean,
  semilla: string,
): readonly PreguntaQuiz[] {
  if (!ordenAleatorio || preguntas.length < 2) {
    return preguntas
  }
  return preguntas
    .map((pregunta) => ({ pregunta, clave: hashDeterminista(`${semilla}:${pregunta.id}`) }))
    .sort((a, b) => a.clave - b.clave)
    .map((entrada) => entrada.pregunta)
}

/**
 * Hash entero de 32 bits sin signo (xmur3), determinista y bien distribuido.
 * Puro: la misma cadena produce el mismo número en cualquier navegador.
 */
function hashDeterminista(cadena: string): number {
  let h = 1779033703 ^ cadena.length
  for (let i = 0; i < cadena.length; i++) {
    h = Math.imul(h ^ cadena.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}
