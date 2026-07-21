import type { ResultadoEjecucionSuite } from "@/features/codigo-ejecucion"
import type { ResultadoEjecucionSql } from "@/features/sql-ejecucion"
import { describe, expect, it } from "vitest"
import { resumenAccesibleTests } from "./codigo-preguntas/terminal-tests"
import { resumenAccesibleSql } from "./sql-ejercicio/terminal-sql"

function suite(pasados: number, totales: number): ResultadoEjecucionSuite {
  return { resultados: [], testsPasados: pasados, testsTotales: totales }
}

function suiteSql(pasados: number, totales: number): ResultadoEjecucionSql {
  return { resultados: [], testsPasados: pasados, testsTotales: totales }
}

describe("resumenAccesibleTests", () => {
  it("no anuncia nada mientras se ejecuta", () => {
    expect(resumenAccesibleTests(suite(0, 3), true)).toBe("")
  })

  it("no anuncia nada sin ejecución previa", () => {
    expect(resumenAccesibleTests(null, false)).toBe("")
  })

  it("anuncia éxito total sin mencionar fallos", () => {
    expect(resumenAccesibleTests(suite(3, 3), false)).toBe(
      "Ejecución completa: pasaron las 3 pruebas.",
    )
  })

  it("anuncia el conteo de fallos cuando hay fallos", () => {
    expect(resumenAccesibleTests(suite(1, 3), false)).toBe(
      "Ejecución completa: 1 de 3 pruebas pasaron; 2 fallaron.",
    )
  })

  it("menciona las pistas cuando un oculto falla con descripción", () => {
    const conPista: ResultadoEjecucionSuite = {
      resultados: [
        {
          testId: "h1",
          descripcion: "prueba con textos",
          visible: false,
          paso: false,
          estado: "fallo",
          stdoutObtenido: "x",
          stdoutEsperado: "y",
          stderr: "",
          duracionMs: 1,
        },
      ],
      testsPasados: 2,
      testsTotales: 3,
    }
    expect(resumenAccesibleTests(conPista, false)).toBe(
      "Ejecución completa: 2 de 3 pruebas pasaron; 1 fallaron. Hay pistas en la consola para afinar tu solución.",
    )
  })
})

describe("resumenAccesibleSql", () => {
  it("no anuncia nada mientras se ejecuta ni sin ejecución previa", () => {
    expect(resumenAccesibleSql(suiteSql(0, 2), true)).toBe("")
    expect(resumenAccesibleSql(null, false)).toBe("")
  })

  it("anuncia éxito total", () => {
    expect(resumenAccesibleSql(suiteSql(2, 2), false)).toBe(
      "Consulta ejecutada: pasaron las 2 pruebas.",
    )
  })

  it("anuncia los fallos", () => {
    expect(resumenAccesibleSql(suiteSql(1, 2), false)).toBe(
      "Consulta ejecutada: 1 de 2 pruebas pasaron; 1 fallaron.",
    )
  })
})
