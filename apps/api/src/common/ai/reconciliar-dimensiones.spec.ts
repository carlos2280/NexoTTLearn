import { describe, expect, it } from "vitest"
import { reconciliarDimensiones } from "./reconciliar-dimensiones"

describe("reconciliarDimensiones", () => {
  it("conserva la nota/comentario de las dimensiones que la IA sí puntuó", () => {
    const r = reconciliarDimensiones(
      [{ dimension: "TypeScript", nota: 90, comentario: "solido" }],
      ["TypeScript"],
    )
    expect(r).toEqual([{ dimension: "TypeScript", nota: 90, comentario: "solido" }])
  })

  it("rellena con nota null las dimensiones esperadas que la IA omitió", () => {
    const r = reconciliarDimensiones([], ["TypeScript", "Testing"])
    expect(r).toHaveLength(2)
    expect(r.every((d) => d.nota === null)).toBe(true)
    expect(r.map((d) => d.dimension)).toEqual(["TypeScript", "Testing"])
  })

  it("descarta dimensiones que la IA inventó fuera de los ejes esperados", () => {
    const r = reconciliarDimensiones(
      [
        { dimension: "TypeScript", nota: 80, comentario: "ok" },
        { dimension: "Inventada", nota: 10, comentario: "no pedida" },
      ],
      ["TypeScript"],
    )
    expect(r).toEqual([{ dimension: "TypeScript", nota: 80, comentario: "ok" }])
  })

  it("respeta el orden canónico de los ejes esperados, no el de la IA", () => {
    const r = reconciliarDimensiones(
      [
        { dimension: "Testing", nota: 70, comentario: "b" },
        { dimension: "TypeScript", nota: 80, comentario: "a" },
      ],
      ["TypeScript", "Testing"],
    )
    expect(r.map((d) => d.dimension)).toEqual(["TypeScript", "Testing"])
  })

  it("hace match tolerante a mayúsculas y espacios", () => {
    const r = reconciliarDimensiones(
      [{ dimension: "  typescript ", nota: 88, comentario: "ok" }],
      ["TypeScript"],
    )
    expect(r[0]?.nota).toBe(88)
    // El nombre canónico de la skill se conserva, no el que reescribió la IA.
    expect(r[0]?.dimension).toBe("TypeScript")
  })

  it("sin ejes esperados devuelve lo que la IA entregó tal cual", () => {
    const devueltas = [{ dimension: "Libre", nota: 50, comentario: "x" }]
    expect(reconciliarDimensiones(devueltas, [])).toEqual(devueltas)
  })

  it("ante dimensiones duplicadas de la IA, la primera aparición gana", () => {
    const r = reconciliarDimensiones(
      [
        { dimension: "TypeScript", nota: 80, comentario: "primera" },
        { dimension: "TypeScript", nota: 10, comentario: "segunda" },
      ],
      ["TypeScript"],
    )
    expect(r[0]?.comentario).toBe("primera")
  })
})
