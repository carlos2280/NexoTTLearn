import { describe, expect, it } from "vitest"
import { esCambioRealEscena, firmaEscenaDiagrama } from "./firma-escena"

describe("firmaEscenaDiagrama", () => {
  it("misma escena → misma firma (el hover/selección no la cambia)", () => {
    const elements = [{ id: "a", version: 1 }]
    const appState = { viewBackgroundColor: "#fff" }
    expect(firmaEscenaDiagrama(elements, appState)).toBe(firmaEscenaDiagrama(elements, appState))
  })

  it("cambio en los elementos → firma distinta", () => {
    const antes = firmaEscenaDiagrama([{ id: "a", version: 1 }], undefined)
    const despues = firmaEscenaDiagrama([{ id: "a", version: 2 }], undefined)
    expect(antes).not.toBe(despues)
  })

  it("cambio en el appState saneado → firma distinta", () => {
    const antes = firmaEscenaDiagrama([], { viewBackgroundColor: "#fff" })
    const despues = firmaEscenaDiagrama([], { viewBackgroundColor: "#000" })
    expect(antes).not.toBe(despues)
  })
})

describe("esCambioRealEscena", () => {
  it("la primera firma (línea base, anterior null) NO es cambio", () => {
    expect(esCambioRealEscena(null, "firma-a")).toBe(false)
  })

  it("misma firma que la anterior NO es cambio (ruido de onChange)", () => {
    expect(esCambioRealEscena("firma-a", "firma-a")).toBe(false)
  })

  it("firma distinta a la anterior SÍ es cambio", () => {
    expect(esCambioRealEscena("firma-a", "firma-b")).toBe(true)
  })
})
