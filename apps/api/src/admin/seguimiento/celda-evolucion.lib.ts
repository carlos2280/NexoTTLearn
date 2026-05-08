// Iter 10 · regresión lineal simple para proyección de evolución
// persona × área (PR 3a · endpoint E).

export interface PuntoSerie {
  /** Días desde el primer punto (eje x). */
  readonly x: number
  /** Nota observada (eje y). */
  readonly y: number
}

export interface RegresionLineal {
  readonly pendiente: number
  readonly intercepto: number
}

const N_VENTANA = 5

/**
 * Regresión lineal por mínimos cuadrados sobre los últimos N_VENTANA puntos.
 * Devuelve null si hay menos de 2 puntos o si la varianza de x es 0
 * (todos los puntos del mismo día → recta indefinida).
 */
export function regresionLineal(puntos: readonly PuntoSerie[]): RegresionLineal | null {
  const ventana = puntos.slice(-N_VENTANA)
  if (ventana.length < 2) {
    return null
  }
  const n = ventana.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0
  for (const p of ventana) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumXX += p.x * p.x
  }
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) {
    return null
  }
  const pendiente = (n * sumXY - sumX * sumY) / denom
  const intercepto = (sumY - pendiente * sumX) / n
  return { pendiente, intercepto }
}

export interface ProyeccionInput {
  readonly puntos: readonly PuntoSerie[]
  readonly umbralArea: number
  /** Posición x correspondiente a "hoy" (días desde el primer punto). */
  readonly xHoy: number
}

export interface ProyeccionResultado {
  readonly diasAlObjetivo: number | null
  readonly valorEstimado: number | null
}

/**
 * Calcula proyección a 30 días y días estimados hasta cruzar el umbral.
 * Si pendiente <= 0 o no se puede estimar regresión → ambos null.
 */
export function calcularProyeccion({
  puntos,
  umbralArea,
  xHoy,
}: ProyeccionInput): ProyeccionResultado {
  const reg = regresionLineal(puntos)
  if (reg === null || reg.pendiente <= 0) {
    return { diasAlObjetivo: null, valorEstimado: null }
  }
  const valorHoy = reg.intercepto + reg.pendiente * xHoy
  const valorA30 = clamp(reg.intercepto + reg.pendiente * (xHoy + 30), 0, 100)
  if (valorHoy >= umbralArea) {
    return { diasAlObjetivo: 0, valorEstimado: valorA30 }
  }
  const xObjetivo = (umbralArea - reg.intercepto) / reg.pendiente
  const diasAlObjetivo = Math.max(0, Math.ceil(xObjetivo - xHoy))
  return { diasAlObjetivo, valorEstimado: valorA30 }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
