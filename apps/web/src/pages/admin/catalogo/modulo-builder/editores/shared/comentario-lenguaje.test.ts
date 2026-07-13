import { describe, expect, it } from "vitest"
import { comentarioLinea } from "./comentario-lenguaje"

describe("comentarioLinea", () => {
  it("usa # para Python", () => {
    expect(comentarioLinea("python")).toBe("#")
  })

  it("usa // para JS/TS y cualquier otro lenguaje tipo C", () => {
    expect(comentarioLinea("javascript")).toBe("//")
    expect(comentarioLinea("typescript")).toBe("//")
    expect(comentarioLinea("otro")).toBe("//")
    expect(comentarioLinea("")).toBe("//")
  })
})
