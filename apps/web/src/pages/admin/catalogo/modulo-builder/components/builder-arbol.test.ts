import { describe, expect, it } from "vitest"
import { idsSeccionesNuevas } from "./builder-arbol"

describe("idsSeccionesNuevas", () => {
  it("con conjunto de conocidas vacío, todas las secciones son nuevas", () => {
    expect(idsSeccionesNuevas(["a", "b", "c"], new Set())).toEqual(["a", "b", "c"])
  })

  it("solo devuelve las secciones que aún no se conocían", () => {
    expect(idsSeccionesNuevas(["a", "b", "c"], new Set(["a", "b"]))).toEqual(["c"])
  })

  it("si todas ya son conocidas, no hay nuevas (no se re-expande nada)", () => {
    expect(idsSeccionesNuevas(["a", "b"], new Set(["a", "b"]))).toEqual([])
  })

  it("una sección conocida que el usuario colapsó no reaparece como nueva", () => {
    // "b" fue colapsada por el usuario; sigue en conocidas → no vuelve a expandirse.
    expect(idsSeccionesNuevas(["a", "b", "c"], new Set(["a", "b", "c"]))).toEqual([])
  })

  it("preserva el orden de aparición de las nuevas", () => {
    expect(idsSeccionesNuevas(["z", "y", "x"], new Set(["y"]))).toEqual(["z", "x"])
  })
})
