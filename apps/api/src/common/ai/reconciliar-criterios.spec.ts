import { describe, expect, it } from "vitest"
import { reconciliarCriterios } from "./reconciliar-criterios"

describe("reconciliarCriterios", () => {
  it("conserva el cumple/evidencia de los criterios que la IA sí verificó", () => {
    const r = reconciliarCriterios(
      [{ criterio: "README claro", cumple: "cumple", evidencia: "tiene setup" }],
      ["README claro"],
    )
    expect(r).toEqual([{ criterio: "README claro", cumple: "cumple", evidencia: "tiene setup" }])
  })

  it("rellena con cumple null los criterios esperados que la IA omitió", () => {
    const r = reconciliarCriterios([], ["README claro", "Estructura ordenada"])
    expect(r).toHaveLength(2)
    expect(r.every((c) => c.cumple === null)).toBe(true)
    expect(r.map((c) => c.criterio)).toEqual(["README claro", "Estructura ordenada"])
  })

  it("descarta criterios que la IA inventó fuera de la lista declarada", () => {
    const r = reconciliarCriterios(
      [
        { criterio: "README claro", cumple: "cumple", evidencia: "ok" },
        { criterio: "Inventado", cumple: "no", evidencia: "no pedido" },
      ],
      ["README claro"],
    )
    expect(r).toEqual([{ criterio: "README claro", cumple: "cumple", evidencia: "ok" }])
  })

  it("respeta el orden canónico de la lista del admin, no el de la IA", () => {
    const r = reconciliarCriterios(
      [
        { criterio: "Estructura ordenada", cumple: "parcial", evidencia: "b" },
        { criterio: "README claro", cumple: "cumple", evidencia: "a" },
      ],
      ["README claro", "Estructura ordenada"],
    )
    expect(r.map((c) => c.criterio)).toEqual(["README claro", "Estructura ordenada"])
  })

  it("hace match tolerante a mayúsculas y espacios", () => {
    const r = reconciliarCriterios(
      [{ criterio: "  readme claro ", cumple: "cumple", evidencia: "ok" }],
      ["README claro"],
    )
    expect(r[0]?.cumple).toBe("cumple")
    // El texto canónico del admin se conserva, no el que reescribió la IA.
    expect(r[0]?.criterio).toBe("README claro")
  })

  it("sin lista declarada devuelve [] (la IA no inventa un checklist)", () => {
    const devueltos = [{ criterio: "Libre", cumple: "cumple" as const, evidencia: "x" }]
    expect(reconciliarCriterios(devueltos, [])).toEqual([])
  })

  it("ante criterios duplicados de la IA, la primera aparición gana", () => {
    const r = reconciliarCriterios(
      [
        { criterio: "README claro", cumple: "cumple", evidencia: "primera" },
        { criterio: "README claro", cumple: "no", evidencia: "segunda" },
      ],
      ["README claro"],
    )
    expect(r[0]?.evidencia).toBe("primera")
  })
})
