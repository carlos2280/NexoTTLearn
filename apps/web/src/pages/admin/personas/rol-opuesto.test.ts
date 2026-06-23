import { describe, expect, it } from "vitest"
import { rolOpuesto } from "./rol-opuesto"

describe("rolOpuesto", () => {
  it("ADMIN alterna a PARTICIPANTE", () => {
    expect(rolOpuesto("ADMIN")).toBe("PARTICIPANTE")
  })

  it("PARTICIPANTE alterna a ADMIN", () => {
    expect(rolOpuesto("PARTICIPANTE")).toBe("ADMIN")
  })
})
