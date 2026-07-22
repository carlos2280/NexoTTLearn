import type { ResultadoTestUI } from "@/features/codigo-ejecucion"
import type { ResultadoTestGuardado } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { reconstruirEjecucion } from "./reconstruir-ejecucion"

function test(paso: boolean, visible: boolean, id: string): ResultadoTestGuardado {
  return {
    testId: id,
    descripcion: `caso ${id}`,
    visible,
    paso,
    estado: paso ? "ok" : "fallo",
    stdoutObtenido: paso ? "ok" : "x",
    stdoutEsperado: "ok",
    stderr: "",
    duracionMs: 3,
  }
}

describe("reconstruirEjecucion", () => {
  it("cuenta pasados y totales a partir de los tests guardados", () => {
    const suite = reconstruirEjecucion([
      test(true, true, "a"),
      test(false, false, "b"),
      test(true, false, "c"),
    ])
    expect(suite.testsTotales).toBe(3)
    expect(suite.testsPasados).toBe(2)
    expect(suite.resultados).toHaveLength(3)
  })

  it("suite vacía para lista vacía", () => {
    const suite = reconstruirEjecucion([])
    expect(suite.testsTotales).toBe(0)
    expect(suite.testsPasados).toBe(0)
  })

  it("el shape guardado es equivalente al de la terminal (drift guard, compile-time)", () => {
    // `reconstruirEjecucion` reenvía los resultados SIN remapear; esto falla a
    // COMPILAR si ResultadoTestGuardado y ResultadoTestUI dejan de coincidir.
    const guardado = test(true, false, "x")
    const comoUi: ResultadoTestUI = guardado
    const comoGuardado: ResultadoTestGuardado = comoUi
    expect(comoGuardado.testId).toBe(comoUi.testId)
  })
})
