import type { MatrizCelda, MatrizCursoResponse } from "@nexott-learn/shared-types"

export interface StatsArea {
  readonly total: number
  readonly conNota: number
  readonly cumplen: number
  readonly noCumplen: number
  readonly cerca: number
  readonly promedio: number | null
}

export function calcularStatsArea(matriz: MatrizCursoResponse, areaId: string): StatsArea {
  const celdas: MatrizCelda[] = matriz.filas
    .map((fila) => fila.celdas.find((c) => c.areaId === areaId))
    .filter((c): c is MatrizCelda => c !== undefined)

  const total = celdas.length
  const conNotaArr = celdas.filter((c) => c.nota !== null)
  const conNota = conNotaArr.length
  const cumplen = celdas.filter((c) => c.semaforo === "verde").length
  const cerca = celdas.filter((c) => c.semaforo === "amarillo").length
  const noCumplen = celdas.filter((c) => c.semaforo === "rojo").length
  const promedio =
    conNota === 0
      ? null
      : Math.round(conNotaArr.reduce((acc, c) => acc + (c.nota ?? 0), 0) / conNota)

  return { total, conNota, cumplen, noCumplen, cerca, promedio }
}
