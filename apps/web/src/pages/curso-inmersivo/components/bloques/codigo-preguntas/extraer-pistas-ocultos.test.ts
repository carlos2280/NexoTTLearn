import type { ResultadoTestUI } from "@/features/codigo-ejecucion"
import { describe, expect, it } from "vitest"
import { extraerPistasOcultos } from "./extraer-pistas-ocultos"

function resultado(overrides: Partial<ResultadoTestUI>): ResultadoTestUI {
  return {
    testId: "t1",
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

describe("extraerPistasOcultos", () => {
  it("devuelve solo descripciones de ocultos que fallaron", () => {
    const pistas = extraerPistasOcultos([
      resultado({ testId: "vis", visible: true, paso: false, descripcion: "visible falla" }),
      resultado({ testId: "ok", visible: false, paso: true, descripcion: "oculto ok" }),
      resultado({ testId: "mal", visible: false, paso: false, descripcion: "prueba con textos" }),
    ])
    expect(pistas).toEqual([{ testId: "mal", texto: "prueba con textos" }])
  })

  it("descarta ocultos fallidos sin descripción (o solo espacios)", () => {
    const pistas = extraerPistasOcultos([
      resultado({ testId: "a", visible: false, paso: false, descripcion: "" }),
      resultado({ testId: "b", visible: false, paso: false, descripcion: "   " }),
    ])
    expect(pistas).toEqual([])
  })

  it("nunca expone entrada ni salida esperada, solo la descripción", () => {
    const pistas = extraerPistasOcultos([
      resultado({
        testId: "sec",
        visible: false,
        paso: false,
        descripcion: "revisa el caso límite",
        stdoutEsperado: "SECRETO",
        stdoutObtenido: "otro",
      }),
    ])
    expect(pistas).toEqual([{ testId: "sec", texto: "revisa el caso límite" }])
  })

  it("preserva el orden de aparición", () => {
    const pistas = extraerPistasOcultos([
      resultado({ testId: "x", visible: false, paso: false, descripcion: "uno" }),
      resultado({ testId: "y", visible: false, paso: false, descripcion: "dos" }),
    ])
    expect(pistas.map((p) => p.texto)).toEqual(["uno", "dos"])
  })
})
