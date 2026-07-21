import type { CupoIntentosTransversal } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  copyIntentosRestantes,
  hayIntentosDisponibles,
  intentosRestantes,
} from "./cupo-transversal.helpers"

function cupo(intentosUsados: number, intentosCupo: number): CupoIntentosTransversal {
  return { asignacionId: "a-1", intentosUsados, intentosCupo }
}

describe("intentosRestantes", () => {
  it("resta usados al cupo", () => {
    expect(intentosRestantes(cupo(1, 3))).toBe(2)
  })

  it("nunca es negativo (usados > cupo por carrera)", () => {
    expect(intentosRestantes(cupo(4, 3))).toBe(0)
  })
})

describe("hayIntentosDisponibles", () => {
  it("true cuando quedan intentos", () => {
    expect(hayIntentosDisponibles(cupo(2, 3))).toBe(true)
  })

  it("false cuando se agotaron", () => {
    expect(hayIntentosDisponibles(cupo(3, 3))).toBe(false)
  })
})

describe("copyIntentosRestantes", () => {
  it("plural cuando quedan varios", () => {
    expect(copyIntentosRestantes(cupo(1, 3))).toBe("Te quedan 2 de 3 intentos")
  })

  it("singular del verbo cuando queda uno, sustantivo en plural", () => {
    expect(copyIntentosRestantes(cupo(2, 3))).toBe("Te queda 1 de 3 intentos")
  })
})
