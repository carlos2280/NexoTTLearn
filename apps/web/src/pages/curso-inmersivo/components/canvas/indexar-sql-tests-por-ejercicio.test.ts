import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { indexarSqlTestsPorEjercicio } from "./indexar-sql-tests-por-ejercicio"

const EJERCICIO_ID = "11111111-1111-4111-8111-111111111111"

function bloque(overrides: Partial<BloqueDetalleResponse>): BloqueDetalleResponse {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    seccionId: "22222222-2222-4222-8222-222222222222",
    orden: 0,
    tipo: "SQL_TESTS",
    esEvaluable: false,
    skillQueMideId: null,
    estado: "ACTIVO",
    version: 1,
    createdAt: "2026-07-07T00:00:00.000Z",
    updatedAt: "2026-07-07T00:00:00.000Z",
    contenido: null,
    ...overrides,
  }
}

const contenidoSqlTestsValido = {
  sqlEjercicioId: EJERCICIO_ID,
  tests: [{ id: "t1", consultaReferencia: "SELECT 1" }],
}

describe("indexarSqlTestsPorEjercicio", () => {
  it("indexa un SQL_TESTS por su sqlEjercicioId", () => {
    const indice = indexarSqlTestsPorEjercicio([
      bloque({ tipo: "SQL_TESTS", contenido: contenidoSqlTestsValido }),
    ])
    const entrada = indice.get(EJERCICIO_ID)
    expect(entrada).toBeDefined()
    expect(entrada?.tests).toHaveLength(1)
    // El schema aplica defaults (visible, ordenImporta, etc.).
    expect(entrada?.tests[0]).toMatchObject({ id: "t1", visible: true, ordenImporta: false })
  })

  it("ignora bloques que no son SQL_TESTS", () => {
    const indice = indexarSqlTestsPorEjercicio([
      bloque({ tipo: "SQL_EJERCICIO", contenido: { enunciado: "x" } }),
      bloque({ tipo: "PARRAFO", contenido: { texto: "hola" } }),
    ])
    expect(indice.size).toBe(0)
  })

  it("descarta un SQL_TESTS con contenido malformado (safeParse falla)", () => {
    const indice = indexarSqlTestsPorEjercicio([
      bloque({ tipo: "SQL_TESTS", contenido: { sqlEjercicioId: "no-es-uuid", tests: [] } }),
    ])
    expect(indice.size).toBe(0)
  })

  it("indexa varios ejercicios distintos", () => {
    const otroId = "33333333-3333-4333-8333-333333333333"
    const indice = indexarSqlTestsPorEjercicio([
      bloque({ id: "a", tipo: "SQL_TESTS", contenido: contenidoSqlTestsValido }),
      bloque({
        id: "b",
        tipo: "SQL_TESTS",
        contenido: {
          sqlEjercicioId: otroId,
          tests: [{ id: "t1", consultaReferencia: "SELECT 2" }],
        },
      }),
    ])
    expect(indice.size).toBe(2)
    expect(indice.has(EJERCICIO_ID)).toBe(true)
    expect(indice.has(otroId)).toBe(true)
  })
})
