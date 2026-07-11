import { describe, expect, it } from "vitest"
import type { TestSqlUnit } from "../sql-tests/fila-test-sql"
import { construirContenidoTestsSql } from "./borrador-tests-sql"

const EJ_ID = "00000000-0000-4000-8000-000000000001"

function test(parcial: Partial<TestSqlUnit>): TestSqlUnit {
  return {
    id: "t1",
    descripcion: "",
    esquemaSemilla: "",
    consultaReferencia: "SELECT 1;",
    visible: true,
    ordenImporta: false,
    ...parcial,
  }
}

describe("construirContenidoTestsSql", () => {
  it("devuelve null si algún test tiene consultaReferencia vacía (no tumba el guardado)", () => {
    const tests = [test({ id: "a" }), test({ id: "b", consultaReferencia: "" })]
    expect(construirContenidoTestsSql(EJ_ID, tests)).toBeNull()
  })

  it("trata consultaReferencia con solo espacios como vacía", () => {
    const tests = [test({ id: "a", consultaReferencia: "   \n  " })]
    expect(construirContenidoTestsSql(EJ_ID, tests)).toBeNull()
  })

  it("devuelve { sqlEjercicioId, tests } cuando todos los tests están completos", () => {
    const tests = [test({ id: "a" }), test({ id: "b", consultaReferencia: "SELECT 2;" })]
    const resultado = construirContenidoTestsSql(EJ_ID, tests)
    expect(resultado).toEqual({ sqlEjercicioId: EJ_ID, tests })
  })

  it("preserva el enlace sqlEjercicioId sin depender de los tests", () => {
    const resultado = construirContenidoTestsSql(EJ_ID, [test({})])
    expect(resultado?.sqlEjercicioId).toBe(EJ_ID)
  })
})
