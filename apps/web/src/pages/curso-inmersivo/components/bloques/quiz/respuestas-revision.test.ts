import type { RespuestasIntento } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { construirRespuestasRevision } from "./respuestas-revision"

const quiz: RespuestasIntento = {
  tipo: "QUIZ",
  preguntas: [
    { preguntaId: "q1", tipo: "OPCION_UNICA", opcionElegidaId: "o2" },
    { preguntaId: "q2", tipo: "OPCION_MULTIPLE", opcionesElegidasIds: ["a", "c"] },
    { preguntaId: "q3", tipo: "VERDADERO_FALSO", valor: true },
    { preguntaId: "q4", tipo: "RESPUESTA_CORTA", texto: "hola" },
  ],
}

describe("construirRespuestasRevision", () => {
  it("expone las respuestas guardadas del quiz por su preguntaId", () => {
    const rev = construirRespuestasRevision(quiz)
    expect(rev.opcionUnica("q1")).toBe("o2")
    expect(rev.opcionMultiple("q2")).toEqual(["a", "c"])
    expect(rev.vf("q3")).toBe(true)
    expect(rev.texto("q4")).toBe("hola")
    expect(rev.contestadas).toBe(4)
  })

  it("devuelve vacio para preguntas sin respuesta guardada", () => {
    const rev = construirRespuestasRevision(quiz)
    expect(rev.opcionUnica("desconocida")).toBeNull()
    expect(rev.opcionMultiple("desconocida")).toEqual([])
    expect(rev.vf("desconocida")).toBeNull()
    expect(rev.texto("desconocida")).toBe("")
  })

  it("los setters son no-op y construirEnvio no aporta respuestas", () => {
    const rev = construirRespuestasRevision(quiz)
    rev.setOpcionUnica("q1", "otra")
    rev.setTexto("q4", "cambiada")
    // el adaptador es inmutable: la lectura no cambia
    expect(rev.opcionUnica("q1")).toBe("o2")
    expect(rev.texto("q4")).toBe("hola")
    expect(rev.construirEnvio([])).toEqual([])
  })

  it("devuelve adaptador vacio si no es un intento QUIZ o es undefined", () => {
    const codigo: RespuestasIntento = {
      tipo: "CODIGO_PREGUNTAS",
      codigoEnviado: "print(1)",
      resultadosTests: [
        { testId: "t1", paso: true, estado: "ok", stdoutObtenido: "1", stderr: "", duracionMs: 5 },
      ],
    }
    expect(construirRespuestasRevision(codigo).contestadas).toBe(0)
    expect(construirRespuestasRevision(undefined).contestadas).toBe(0)
    expect(construirRespuestasRevision(undefined).opcionUnica("q1")).toBeNull()
  })
})
