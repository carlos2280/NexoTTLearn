import type { PreguntaQuiz } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { ordenarPreguntasQuiz } from "./ordenar-preguntas"

function preguntasDe(ids: readonly string[]): PreguntaQuiz[] {
  return ids.map((id) => ({
    id,
    enunciado: `¿${id}?`,
    pesoPunto: 1,
    tipo: "VERDADERO_FALSO",
    correcta: false,
  }))
}

const ids = (preguntas: readonly PreguntaQuiz[]): string[] => preguntas.map((p) => p.id)

describe("ordenarPreguntasQuiz", () => {
  const base = preguntasDe(["a", "b", "c", "d", "e", "f", "g", "h"])

  it("respeta el orden del admin cuando ordenAleatorio es false", () => {
    const resultado = ordenarPreguntasQuiz(base, false, "colab-1:bloque-1")
    expect(resultado).toBe(base)
  })

  it("no baraja cuando hay menos de dos preguntas", () => {
    const una = preguntasDe(["sola"])
    expect(ordenarPreguntasQuiz(una, true, "colab-1:bloque-1")).toBe(una)
  })

  it("baraja de forma determinista: misma semilla, mismo orden", () => {
    const a = ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    const b = ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    expect(ids(a)).toEqual(ids(b))
  })

  it("es una permutación: conserva todas las preguntas sin duplicar ni perder", () => {
    const resultado = ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    expect([...ids(resultado)].sort()).toEqual([...ids(base)].sort())
    expect(resultado).toHaveLength(base.length)
  })

  it("realmente cambia el orden respecto al del admin", () => {
    const resultado = ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    expect(ids(resultado)).not.toEqual(ids(base))
  })

  it("participantes distintos reciben órdenes distintos", () => {
    const uno = ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    const otro = ordenarPreguntasQuiz(base, true, "colab-2:bloque-1")
    expect(ids(uno)).not.toEqual(ids(otro))
  })

  it("el mismo participante recibe órdenes distintos en bloques distintos", () => {
    const bloqueUno = ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    const bloqueDos = ordenarPreguntasQuiz(base, true, "colab-1:bloque-2")
    expect(ids(bloqueUno)).not.toEqual(ids(bloqueDos))
  })

  it("no muta el arreglo de entrada", () => {
    const original = ids(base)
    ordenarPreguntasQuiz(base, true, "colab-1:bloque-1")
    expect(ids(base)).toEqual(original)
  })
})
