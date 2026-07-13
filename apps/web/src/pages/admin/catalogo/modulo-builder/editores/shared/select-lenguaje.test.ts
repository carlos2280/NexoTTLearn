import { describe, expect, it } from "vitest"
import { LENGUAJES_EJECUTABLES } from "./select-lenguaje"

describe("LENGUAJES_EJECUTABLES", () => {
  it("ofrece exactamente los lenguajes que el runner ejecuta (TS/JS/Python)", () => {
    // Guard: si el runner (sandbox.worker) gana o pierde un lenguaje, la fuente
    // de verdad es `lenguajeEjecutableSchema`; este test detecta la divergencia.
    expect(LENGUAJES_EJECUTABLES.map((l) => l.id)).toEqual(["typescript", "javascript", "python"])
  })

  it("no incluye lenguajes sin runner (sql/java/etc.)", () => {
    const ids = LENGUAJES_EJECUTABLES.map((l) => l.id)
    expect(ids).not.toContain("sql")
    expect(ids).not.toContain("java")
  })
})
