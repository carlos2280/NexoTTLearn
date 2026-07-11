import type { BloqueResponse, TipoBloque } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  bloquesVisibles,
  construirPermutacionConOcultos,
  esBloqueOculto,
} from "./reordenar-bloques"

function bloque(id: string, tipo: TipoBloque, orden: number): BloqueResponse {
  return {
    id,
    seccionId: "sec-1",
    orden,
    tipo,
    esEvaluable: false,
    skillQueMideId: null,
    estado: "ACTIVO",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

describe("esBloqueOculto", () => {
  it("oculta CODIGO_TESTS y SQL_TESTS, y muestra el resto", () => {
    expect(esBloqueOculto(bloque("t", "CODIGO_TESTS", 1))).toBe(true)
    expect(esBloqueOculto(bloque("ts", "SQL_TESTS", 1))).toBe(true)
    expect(esBloqueOculto(bloque("r", "CODIGO_PREGUNTAS", 1))).toBe(false)
    expect(esBloqueOculto(bloque("rs", "SQL_EJERCICIO", 1))).toBe(false)
    expect(esBloqueOculto(bloque("p", "PARRAFO", 1))).toBe(false)
  })
})

describe("bloquesVisibles", () => {
  it("filtra los CODIGO_TESTS", () => {
    const bloques = [
      bloque("p", "PARRAFO", 1),
      bloque("r", "CODIGO_PREGUNTAS", 2),
      bloque("t", "CODIGO_TESTS", 3),
    ]
    expect(bloquesVisibles(bloques).map((b) => b.id)).toEqual(["p", "r"])
  })
})

describe("construirPermutacionConOcultos", () => {
  it("mantiene cada test pegado a su reto tras reordenar los visibles", () => {
    // Orden original: Parrafo, Reto A (+ Test A), Reto B (+ Test B)
    const bloques = [
      bloque("p", "PARRAFO", 1),
      bloque("rA", "CODIGO_PREGUNTAS", 2),
      bloque("tA", "CODIGO_TESTS", 3),
      bloque("rB", "CODIGO_PREGUNTAS", 4),
      bloque("tB", "CODIGO_TESTS", 5),
    ]
    // El admin mueve Reto B delante de Reto A: visibles -> [p, rB, rA]
    const permutacion = construirPermutacionConOcultos(bloques, ["p", "rB", "rA"])
    expect(permutacion).toEqual([
      { bloqueId: "p", orden: 1 },
      { bloqueId: "rB", orden: 2 },
      { bloqueId: "tB", orden: 3 },
      { bloqueId: "rA", orden: 4 },
      { bloqueId: "tA", orden: 5 },
    ])
  })

  it("cubre exactamente todos los bloques de la seccion (contrato del backend)", () => {
    const bloques = [
      bloque("rA", "CODIGO_PREGUNTAS", 1),
      bloque("tA", "CODIGO_TESTS", 2),
      bloque("rB", "CODIGO_PREGUNTAS", 3),
      bloque("tB", "CODIGO_TESTS", 4),
    ]
    const permutacion = construirPermutacionConOcultos(bloques, ["rB", "rA"])
    const ids = permutacion.map((p) => p.bloqueId).sort()
    expect(ids).toEqual(["rA", "rB", "tA", "tB"])
    // ordenes 1..N sin huecos ni repetidos
    expect(permutacion.map((p) => p.orden)).toEqual([1, 2, 3, 4])
  })

  it("mantiene el SQL_TESTS pegado a su SQL_EJERCICIO junto a un par CODIGO", () => {
    // Reto de código (+ su test) y Reto SQL (+ su test) en la misma sección.
    const bloques = [
      bloque("rCod", "CODIGO_PREGUNTAS", 1),
      bloque("tCod", "CODIGO_TESTS", 2),
      bloque("rSql", "SQL_EJERCICIO", 3),
      bloque("tSql", "SQL_TESTS", 4),
    ]
    // El admin sube el Reto SQL delante del de código: visibles -> [rSql, rCod]
    const permutacion = construirPermutacionConOcultos(bloques, ["rSql", "rCod"])
    expect(permutacion).toEqual([
      { bloqueId: "rSql", orden: 1 },
      { bloqueId: "tSql", orden: 2 },
      { bloqueId: "rCod", orden: 3 },
      { bloqueId: "tCod", orden: 4 },
    ])
  })

  it("preserva al inicio los ocultos sin ancla previa (legacy)", () => {
    const bloques = [
      bloque("tHuerfano", "CODIGO_TESTS", 1),
      bloque("r", "CODIGO_PREGUNTAS", 2),
      bloque("t", "CODIGO_TESTS", 3),
    ]
    const permutacion = construirPermutacionConOcultos(bloques, ["r"])
    expect(permutacion).toEqual([
      { bloqueId: "tHuerfano", orden: 1 },
      { bloqueId: "r", orden: 2 },
      { bloqueId: "t", orden: 3 },
    ])
  })
})
