import { describe, expect, it } from "vitest"

import { MAX_ETIQUETA_SKILL, etiquetaSkillPorDefecto } from "./skill-por-defecto"

describe("etiquetaSkillPorDefecto", () => {
  it("une curso y modulo con « · »", () => {
    expect(etiquetaSkillPorDefecto("Data Engineer", "Modulo 1")).toBe("Data Engineer · Modulo 1")
  })

  it("corta al tope de etiqueta que acepta el importador", () => {
    const etiqueta = etiquetaSkillPorDefecto("c".repeat(150), "m".repeat(150))
    expect(MAX_ETIQUETA_SKILL).toBe(200)
    expect(etiqueta).toHaveLength(MAX_ETIQUETA_SKILL)
    expect(etiqueta.startsWith(`${"c".repeat(150)} · `)).toBe(true)
  })
})
