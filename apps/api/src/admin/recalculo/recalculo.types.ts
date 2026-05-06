// Iter 9.9 · tipos del servicio de recalculo encadenado.
// MAESTRO §17.3 · cadena bloque→seccion→modulo→area→curso→etiqueta.

import type { EtiquetaLogro } from "@prisma/client"

/**
 * Snapshot derivado (no persistido) de las notas agregadas de una
 * inscripcion en un momento dado. Las notas viven calculadas a partir
 * de las entregas; aqui las "materializamos" en memoria para diff
 * pre/post recalculo.
 *
 * Convencion:
 * - `null` => no hay datos suficientes en ese nivel (sin entregas, sin
 *   pesos, etc). NO se considera "0".
 * - Numeros: 0–100 con redondeo HALF_UP a 2 decimales (MAESTRO §17.9).
 */
export interface AgregadosInscripcion {
  /** notaModulo por moduloId. Solo modulos con al menos una entrega evaluada. */
  notasModulo: Map<string, number>
  /** notaArea por areaId. Solo areas con al menos un modulo con nota. */
  notasArea: Map<string, number>
  /** notaCurso global. null si no hay datos suficientes. */
  notaCurso: number | null
  /** etiqueta de logro derivada de notaCurso + umbrales del curso. */
  etiqueta: EtiquetaLogro | null
}

export interface DiffAgregados {
  modulosCambiados: Array<{ moduloId: string; antes: number | null; despues: number | null }>
  areasCambiadas: Array<{ areaId: string; antes: number | null; despues: number | null }>
  cursoCambio: { antes: number | null; despues: number | null } | null
  etiquetaCambio: { antes: EtiquetaLogro | null; despues: EtiquetaLogro | null } | null
  /** true si NINGUN agregado cambio (idempotencia A26 caso borde 1). */
  sinCambios: boolean
}

export const ENTIDAD_TIPO_INSCRIPCION = "Inscripcion"
