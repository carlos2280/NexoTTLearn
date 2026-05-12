/**
 * Helper puro D-S8-C4 — calcula la nota global ponderada del intento
 * transversal aplicando la redistribucion D35 cuando alguna capa esta
 * desactivada o sin nota.
 *
 * Es puro (sin Prisma, sin Nest, sin logger) para mantenerlo trivialmente
 * testeable y reusable. Su contrato:
 *
 *  - Recibe las 3 notas de capa (`number | null`), los pesos del curso
 *    (`number`, normalmente 40/30/30) y las flags `capasActivas`.
 *  - Filtra capas que esten activas Y con nota presente.
 *  - Reescala los pesos vivos para que sumen 100 (D35).
 *  - Promedia ponderadamente.
 *  - Redondea a 2 decimales.
 *  - Si 0 capas vivas -> lanza `Error('PUNTAJES_FALTANTES')` para que el
 *    caller lo traduzca a `409 conflictIntentoTransversalNoEditable`-equivalente
 *    o a `409 puntajesFaltantes`.
 */

export type CapaTransversal = "tests" | "cualitativa" | "comprension"

export interface CapasNotas {
  readonly tests: number | null
  readonly cualitativa: number | null
  readonly comprension: number | null
}

export interface PesosCapas {
  readonly tests: number
  readonly cualitativa: number
  readonly comprension: number
}

export interface CapasActivas {
  readonly tests: boolean
  readonly cualitativa: boolean
  readonly comprension: boolean
}

const CAPAS: readonly CapaTransversal[] = ["tests", "cualitativa", "comprension"] as const
const PRECISION_DECIMAL = 100

export const PUNTAJES_FALTANTES_ERROR = "PUNTAJES_FALTANTES"

export function calcularNotaTransversal(
  capas: CapasNotas,
  pesos: PesosCapas,
  capasActivas: CapasActivas,
): number {
  const vivas = CAPAS.filter((capa) => capasActivas[capa] === true && capas[capa] !== null)
  if (vivas.length === 0) {
    throw new Error(PUNTAJES_FALTANTES_ERROR)
  }

  const sumaPesosVivos = vivas.reduce((sum, capa) => sum + pesos[capa], 0)
  if (sumaPesosVivos <= 0) {
    // Coherencia: pesos vivos en 0 implica que el curso esta mal configurado.
    // Tratamos como puntajes faltantes (no podemos calcular nota).
    throw new Error(PUNTAJES_FALTANTES_ERROR)
  }

  const ponderada = vivas.reduce((acc, capa) => {
    const peso = pesos[capa] / sumaPesosVivos
    const nota = capas[capa] as number
    return acc + peso * nota
  }, 0)

  return Math.round(ponderada * PRECISION_DECIMAL) / PRECISION_DECIMAL
}
