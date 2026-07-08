import type { TestSql } from "@nexott-learn/shared-types"

/**
 * Tipos del módulo `sql-ejecucion` — ejecuta la consulta del participante en
 * PGlite (Postgres en WASM, en el navegador) contra una semilla, y verifica
 * por **conjuntos de filas** comparando con la consulta de referencia. El
 * backend recalcula la nota desde los `paso`, nunca confía en una nota
 * agregada del cliente (mismo modelo que `codigo-ejecucion`).
 */

export interface InputEjecucionSql {
  /** Semilla del ejercicio (DDL + INSERTs). Los tests pueden traer la suya. */
  readonly esquemaSemillaEjercicio: string
  readonly tests: readonly TestSql[]
  readonly consulta: string
  readonly tiempoLimiteSeg: number
}

/** Conjunto de filas normalizado (celdas ya serializadas a texto). */
export interface ConjuntoFilas {
  readonly columnas: readonly string[]
  readonly filas: readonly (readonly string[])[]
}

/** Resultado por test enriquecido para pintar la grilla al participante. */
export interface ResultadoTestSqlUI {
  readonly testId: string
  readonly descripcion: string
  readonly visible: boolean
  readonly paso: boolean
  readonly estado: "ok" | "timeout" | "fallo"
  /** Filas devueltas por la consulta del alumno (para la grilla). */
  readonly obtenido: ConjuntoFilas
  /** Filas de la consulta de referencia (solo se muestran si el test es visible). */
  readonly esperado: ConjuntoFilas
  readonly error: string
  readonly duracionMs: number
}

export interface ResultadoEjecucionSql {
  readonly resultados: readonly ResultadoTestSqlUI[]
  readonly testsPasados: number
  readonly testsTotales: number
}
