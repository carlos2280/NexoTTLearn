import type { ConjuntoFilas } from "./types"

/**
 * Normaliza el resultado crudo de PGlite (`{ rows, fields }`) a un
 * `ConjuntoFilas` con celdas serializadas a texto, en el orden de columnas
 * que devolvió la consulta.
 */
export function normalizarResultadoPglite(res: {
  readonly rows: readonly Record<string, unknown>[]
  readonly fields: readonly { readonly name: string }[]
}): ConjuntoFilas {
  const columnas = res.fields.map((f) => f.name)
  const filas = res.rows.map((row) => columnas.map((c) => normalizarCelda(row[c])))
  return { columnas, filas }
}

/**
 * Serializa una celda a texto estable para comparar. `null`/`undefined` usan
 * un centinela distinto del string vacío; objetos (jsonb, arrays) van como
 * JSON; el resto vía `String`.
 */
export function normalizarCelda(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return "∅"
  }
  if (typeof valor === "object") {
    return JSON.stringify(valor)
  }
  return String(valor)
}

/**
 * Decide si el resultado del alumno coincide con el esperado. Compara por
 * VALORES en el orden de columnas (ignora los nombres de columna): mismo
 * número de columnas y filas, y — según `ordenImporta` — misma secuencia de
 * filas o mismo multiconjunto.
 */
export function filasCoinciden(
  alumno: ConjuntoFilas,
  esperado: ConjuntoFilas,
  ordenImporta: boolean,
): boolean {
  if (alumno.columnas.length !== esperado.columnas.length) {
    return false
  }
  if (alumno.filas.length !== esperado.filas.length) {
    return false
  }
  const filasAlumno = alumno.filas.map((f) => JSON.stringify(f))
  const filasEsperado = esperado.filas.map((f) => JSON.stringify(f))
  if (ordenImporta) {
    return filasAlumno.every((fila, i) => fila === filasEsperado[i])
  }
  const ordenadasAlumno = [...filasAlumno].sort()
  const ordenadasEsperado = [...filasEsperado].sort()
  return ordenadasAlumno.every((fila, i) => fila === ordenadasEsperado[i])
}
