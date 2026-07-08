import type { TestSql } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { ejecutarSuiteSql } from "./ejecutar-suite-sql"

/**
 * Integración del runner SQL contra PGlite REAL (Postgres en WASM, que también
 * corre en Node). No mockea la base: prueba el motor de punta a punta — 2 bases
 * frescas por test (referencia + alumno), semilla propia del test y SQL
 * inválido. Es el borde de riesgo del bloque SQL.
 *
 * Coste: PGlite cold-start ~2-5s por base, así que cada caso lleva timeout
 * generoso y el set se mantiene mínimo a propósito. Las aristas del comparador
 * (multiconjunto vs orden) viven en `comparar-filas.test.ts` (puro y rápido);
 * aquí solo probamos la integración real con la base.
 */

const TIMEOUT = 30_000

const SEMILLA = `
  CREATE TABLE usuarios (id int, activo boolean);
  INSERT INTO usuarios VALUES (1, true), (2, false), (3, true);
`

function test(overrides: Partial<TestSql> & Pick<TestSql, "id" | "consultaReferencia">): TestSql {
  return { descripcion: "", visible: true, esquemaSemilla: "", ordenImporta: false, ...overrides }
}

describe("ejecutarSuiteSql (PGlite real)", () => {
  it(
    "marca paso cuando el conjunto de filas del alumno iguala la referencia",
    async () => {
      const res = await ejecutarSuiteSql({
        esquemaSemillaEjercicio: SEMILLA,
        consulta: "SELECT id FROM usuarios WHERE activo",
        tiempoLimiteSeg: 15,
        tests: [
          test({ id: "t1", consultaReferencia: "SELECT id FROM usuarios WHERE activo = true" }),
        ],
      })
      expect(res.testsPasados).toBe(1)
      expect(res.resultados[0]?.paso).toBe(true)
      expect(res.resultados[0]?.estado).toBe("ok")
    },
    TIMEOUT,
  )

  it(
    "falla en mismatch y expone filas obtenidas vs esperadas; usa la semilla propia del test",
    async () => {
      const res = await ejecutarSuiteSql({
        esquemaSemillaEjercicio: SEMILLA,
        consulta: "SELECT id FROM usuarios WHERE activo",
        tiempoLimiteSeg: 15,
        tests: [
          // Semilla propia distinta a la del ejercicio: evita hardcodear la respuesta.
          test({
            id: "t1",
            esquemaSemilla:
              "CREATE TABLE usuarios (id int, activo boolean); INSERT INTO usuarios VALUES (5, true), (6, false);",
            consultaReferencia: "SELECT id FROM usuarios",
          }),
        ],
      })
      const r = res.resultados[0]
      expect(r?.paso).toBe(false)
      expect(r?.obtenido.filas).toEqual([["5"]])
      expect(r?.esperado.filas).toHaveLength(2)
    },
    TIMEOUT,
  )

  it(
    "SQL inválido del alumno reporta estado fallo con error, sin tumbar la suite",
    async () => {
      const res = await ejecutarSuiteSql({
        esquemaSemillaEjercicio: SEMILLA,
        consulta: "SELECT id FROM tabla_inexistente",
        tiempoLimiteSeg: 15,
        tests: [test({ id: "t1", consultaReferencia: "SELECT id FROM usuarios WHERE activo" })],
      })
      const r = res.resultados[0]
      expect(r?.paso).toBe(false)
      expect(r?.estado).toBe("fallo")
      expect(r?.error.length).toBeGreaterThan(0)
    },
    TIMEOUT,
  )
})
