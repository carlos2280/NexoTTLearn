import { describe, expect, it } from "vitest"
import { resumirValidacionReferencia } from "./resumir-validacion-referencia"
import type { ResultadoEjecucionSuite, ResultadoTestUI } from "./types"

function testUi(overrides: Partial<ResultadoTestUI>): ResultadoTestUI {
  return {
    testId: "t",
    descripcion: "",
    visible: true,
    paso: true,
    estado: "ok",
    stdoutObtenido: "",
    stdoutEsperado: "",
    stderr: "",
    duracionMs: 1,
    ...overrides,
  }
}

function suite(resultados: readonly ResultadoTestUI[]): ResultadoEjecucionSuite {
  return {
    resultados,
    testsPasados: resultados.filter((r) => r.paso).length,
    testsTotales: resultados.length,
  }
}

describe("resumirValidacionReferencia", () => {
  it("ok cuando la solución pasa todos los tests", () => {
    const resumen = resumirValidacionReferencia(suite([testUi({}), testUi({}), testUi({})]))
    expect(resumen).toEqual({
      ok: true,
      totales: 3,
      pasados: 3,
      fallidos: [],
      noEjecuta: false,
    })
  })

  it("lista posiciones 1-based (con estado) de los fallidos, en orden", () => {
    const resumen = resumirValidacionReferencia(
      suite([
        testUi({ paso: true }),
        testUi({ paso: false, estado: "ok" }),
        testUi({ paso: true }),
        testUi({ paso: false, estado: "timeout" }),
      ]),
    )
    expect(resumen.ok).toBe(false)
    expect(resumen.fallidos.map((f) => f.numero)).toEqual([2, 4])
    expect(resumen.fallidos[1]?.estado).toBe("timeout")
    expect(resumen).toMatchObject({ totales: 4, pasados: 2, noEjecuta: false })
  })

  it("noEjecuta cuando TODOS fallan sin llegar a correr (compilación/entorno)", () => {
    const resumen = resumirValidacionReferencia(
      suite([
        testUi({ paso: false, estado: "fallo", stderr: "SyntaxError" }),
        testUi({ paso: false, estado: "fallo", stderr: "SyntaxError" }),
      ]),
    )
    expect(resumen.noEjecuta).toBe(true)
    expect(resumen.fallidos[0]?.stderr).toBe("SyntaxError")
  })

  it("NO marca noEjecuta si algún fallo es por salida distinta (estado ok)", () => {
    const resumen = resumirValidacionReferencia(
      suite([testUi({ paso: false, estado: "ok" }), testUi({ paso: false, estado: "fallo" })]),
    )
    expect(resumen.noEjecuta).toBe(false)
  })
})
