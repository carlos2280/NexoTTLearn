import { describe, expect, it } from "vitest"
import { sanitizarAppStateExcalidraw } from "./excalidraw-app-state"

describe("sanitizarAppStateExcalidraw", () => {
  it("devuelve undefined cuando no hay appState", () => {
    expect(sanitizarAppStateExcalidraw(undefined)).toBeUndefined()
  })

  it("conserva solo los campos visuales persistibles", () => {
    const entrada = {
      viewBackgroundColor: "#ffffff",
      gridModeEnabled: true,
      gridSize: 20,
      gridStep: 5,
      zoom: { value: 2 },
      scrollX: 100,
      collaborators: {},
      contextMenu: {},
      activeTool: { type: "selection" },
    }
    expect(sanitizarAppStateExcalidraw(entrada)).toEqual({
      viewBackgroundColor: "#ffffff",
      gridModeEnabled: true,
      gridSize: 20,
      gridStep: 5,
    })
  })

  it("descarta collaborators y todo lo transitorio (raíz del crash y del churn)", () => {
    const resultado = sanitizarAppStateExcalidraw({ collaborators: {}, cursorButton: "up" })
    expect(resultado).toBeUndefined()
  })

  it("devuelve undefined si no hay ningún campo persistible", () => {
    expect(sanitizarAppStateExcalidraw({ scrollX: 10, zoom: { value: 1 } })).toBeUndefined()
  })

  it("no muta el objeto original", () => {
    const entrada = { viewBackgroundColor: "#fff", collaborators: {} }
    sanitizarAppStateExcalidraw(entrada)
    expect(entrada).toHaveProperty("collaborators")
  })
})
