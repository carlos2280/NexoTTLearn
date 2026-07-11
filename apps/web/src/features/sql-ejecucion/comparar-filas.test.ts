import { describe, expect, it } from "vitest"
import { filasCoinciden, normalizarCelda, normalizarResultadoPglite } from "./comparar-filas"
import type { ConjuntoFilas } from "./types"

function conjunto(columnas: string[], filas: string[][]): ConjuntoFilas {
  return { columnas, filas }
}

describe("normalizarCelda", () => {
  it("serializa null/undefined a un centinela distinto del string vacío", () => {
    expect(normalizarCelda(null)).toBe("∅")
    expect(normalizarCelda(undefined)).toBe("∅")
    expect(normalizarCelda("")).toBe("")
  })

  it("serializa objetos como JSON y primitivos con String", () => {
    expect(normalizarCelda({ a: 1 })).toBe('{"a":1}')
    expect(normalizarCelda(42)).toBe("42")
    expect(normalizarCelda(true)).toBe("true")
  })
})

describe("normalizarResultadoPglite", () => {
  it("respeta el orden de columnas de fields", () => {
    const res = normalizarResultadoPglite({
      rows: [{ id: 1, activo: true }],
      fields: [{ name: "id" }, { name: "activo" }],
    })
    expect(res.columnas).toEqual(["id", "activo"])
    expect(res.filas).toEqual([["1", "true"]])
  })
})

describe("filasCoinciden", () => {
  it("multiconjunto: mismo contenido en distinto orden coincide si ordenImporta=false", () => {
    const a = conjunto(["id"], [["2"], ["1"]])
    const b = conjunto(["id"], [["1"], ["2"]])
    expect(filasCoinciden(a, b, false)).toBe(true)
    expect(filasCoinciden(a, b, true)).toBe(false)
  })

  it("distinto número de filas o columnas no coincide", () => {
    expect(filasCoinciden(conjunto(["id"], [["1"]]), conjunto(["id"], [["1"], ["2"]]), false)).toBe(
      false,
    )
    expect(
      filasCoinciden(conjunto(["id"], [["1"]]), conjunto(["id", "x"], [["1", "2"]]), false),
    ).toBe(false)
  })

  it("compara por valores en orden de columnas, ignora nombres de columna", () => {
    const alumno = conjunto(["usuario_id"], [["1"], ["2"]])
    const esperado = conjunto(["id"], [["1"], ["2"]])
    expect(filasCoinciden(alumno, esperado, true)).toBe(true)
  })
})
