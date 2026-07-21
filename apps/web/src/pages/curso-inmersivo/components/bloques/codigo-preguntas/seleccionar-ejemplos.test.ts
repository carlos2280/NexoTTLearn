import type { TestStdinStdout } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { seleccionarEjemplos } from "./seleccionar-ejemplos"

function test(overrides: Partial<TestStdinStdout>): TestStdinStdout {
  return {
    id: "t1",
    descripcion: "",
    entrada: "",
    salidaEsperada: "",
    visible: true,
    ...overrides,
  }
}

describe("seleccionarEjemplos", () => {
  it("devuelve solo los tests visibles, preservando el orden", () => {
    const ejemplos = seleccionarEjemplos([
      test({ id: "a", entrada: "2 3", salidaEsperada: "5", visible: true }),
      test({ id: "b", entrada: "9 9", salidaEsperada: "18", visible: false }),
      test({ id: "c", entrada: "10 20", salidaEsperada: "30", visible: true }),
    ])
    expect(ejemplos.map((e) => e.id)).toEqual(["a", "c"])
    expect(ejemplos[0]).toEqual({
      id: "a",
      entrada: "2 3",
      salidaEsperada: "5",
      descripcion: "",
    })
  })

  it("nunca expone un test oculto aunque tenga entrada/esperado", () => {
    const ejemplos = seleccionarEjemplos([
      test({ id: "secreto", entrada: "42", salidaEsperada: "secreta", visible: false }),
    ])
    expect(ejemplos).toEqual([])
  })

  it("conserva la descripción cuando existe", () => {
    const ejemplos = seleccionarEjemplos([
      test({ id: "a", entrada: "hola", salidaEsperada: "HOLA", descripcion: "mayúsculas" }),
    ])
    expect(ejemplos[0]?.descripcion).toBe("mayúsculas")
  })

  it("devuelve lista vacía si no hay tests visibles", () => {
    expect(seleccionarEjemplos([test({ visible: false })])).toEqual([])
    expect(seleccionarEjemplos([])).toEqual([])
  })
})
