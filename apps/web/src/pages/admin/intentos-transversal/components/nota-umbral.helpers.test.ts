import { describe, expect, it } from "vitest"
import { estadoNota } from "./nota-umbral.helpers"

describe("estadoNota", () => {
  it("sin nota => 'sin-nota' (no inventa un veredicto)", () => {
    expect(estadoNota(null, 70)).toBe("sin-nota")
  })

  it("nota bajo el umbral => 'reprueba'", () => {
    expect(estadoNota(15, 70)).toBe("reprueba")
  })

  it("nota justo en el umbral => 'aprueba' (comparación >=)", () => {
    expect(estadoNota(70, 70)).toBe("aprueba")
  })

  it("nota sobre el umbral => 'aprueba'", () => {
    expect(estadoNota(85, 70)).toBe("aprueba")
  })

  it("nota 0 con umbral 0 => 'aprueba' (borde inferior)", () => {
    expect(estadoNota(0, 0)).toBe("aprueba")
  })
})
