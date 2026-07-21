/**
 * Helpers puros de la nota que ve el PARTICIPANTE en el hito transversal
 * (frente 28). El backend ya proyecta `notaGlobal` (nota efectiva publicada,
 * hasta 2 decimales) y `aprobado`; el umbral llega por
 * `TransversalResponse.umbralAprobacion`. El front NO recalcula el veredicto:
 * `aprobado` es la fuente de verdad. Estos helpers solo derivan cómo PRESENTAR
 * el número y el título motivador. Se testean sin RTL (web = funciones puras).
 */

/** Umbral de la banda "casi": ≥ 85% del umbral (proporción, no puntos fijos). */
const BANDA_CASI = 0.85
/** Umbral de la banda "buen camino": ≥ 50% del umbral. */
const BANDA_CAMINO = 0.5

/**
 * Título motivador GRADUADO para la vista "aún no" (no aprobado). Antes era el
 * fijo "Casi." para todos, que mentía con notas muy bajas (15/100 no es
 * "casi"). Gradúa según qué tan cerca quedó del umbral (proporción
 * `nota / umbral`, no puntos absolutos) para que escale con el umbral de
 * cualquier curso:
 *  - ≥ 85% del umbral → "Casi lo tienes."       (ej. 60-69 con umbral 70)
 *  - ≥ 50% del umbral → "Vas por buen camino."  (ej. 35-59)
 *  - < 50% del umbral → "Es un comienzo."       (ej. 0-34)
 *
 * Solo se usa cuando el intento NO aprobó (nota < umbral). Si el umbral es 0 o
 * negativo (no debería en un transversal real) cae a la banda más alta para no
 * dividir por cero.
 */
export function tituloGraduado(nota: number, umbral: number): string {
  const proporcion = umbral > 0 ? nota / umbral : 1
  if (proporcion >= BANDA_CASI) {
    return "Casi lo tienes."
  }
  if (proporcion >= BANDA_CAMINO) {
    return "Vas por buen camino."
  }
  return "Es un comienzo."
}

/** Nota entera para mostrar al alumno (el backend puede dar hasta 2 decimales). */
export function notaEntera(nota: number): number {
  return Math.round(nota)
}

/**
 * Nota entera a mostrar en la vista "aún no" (no aprobado). Garantiza que la
 * cifra nunca alcance el umbral mostrado: evita el confuso "70 · necesitas 70"
 * cuando la nota real (p. ej. 69.6) redondearía al umbral pese a no aprobar. El
 * veredicto lo manda el backend (`aprobado`); esto es solo presentación.
 */
export function notaEnteraNoAprobado(nota: number, umbral: number): number {
  return Math.max(0, Math.min(notaEntera(nota), notaEntera(umbral) - 1))
}
