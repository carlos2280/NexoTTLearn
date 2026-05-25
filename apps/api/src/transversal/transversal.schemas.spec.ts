import {
  crearIntentoTransversalSchema,
  editarSkillsTransversalSchema,
} from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"

describe("crearIntentoTransversalSchema", () => {
  it("rechaza colaboradorId en body (.strict — OWASP A01)", () => {
    const r = crearIntentoTransversalSchema.safeParse({
      repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar" },
      colaboradorId: "9000000a-0000-0000-0000-000000000001",
    })
    expect(r.success).toBe(false)
  })

  it("rechaza URLs fuera de github/gitlab (D-S8-C1)", () => {
    const r = crearIntentoTransversalSchema.safeParse({
      repoOArtefacto: { tipo: "URL_GIT", url: "https://example.com/foo" },
    })
    expect(r.success).toBe(false)
  })

  it("acepta github.com sin comentario", () => {
    const r = crearIntentoTransversalSchema.safeParse({
      repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar" },
    })
    expect(r.success).toBe(true)
  })

  it("acepta gitlab.com con comentario trimeado", () => {
    const r = crearIntentoTransversalSchema.safeParse({
      repoOArtefacto: { tipo: "URL_GIT", url: "https://gitlab.com/foo/bar" },
      comentarioColaborador: "  texto  ",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.comentarioColaborador).toBe("texto")
    }
  })
})

describe("editarSkillsTransversalSchema", () => {
  it("rechaza array vacio", () => {
    const r = editarSkillsTransversalSchema.safeParse({ skillIds: [] })
    expect(r.success).toBe(false)
  })

  it("rechaza array > 20", () => {
    const ids = Array.from(
      { length: 21 },
      (_, i) => `31111111-1111-1111-1111-${i.toString().padStart(12, "0")}`,
    )
    const r = editarSkillsTransversalSchema.safeParse({ skillIds: ids })
    expect(r.success).toBe(false)
  })

  it("acepta lista de UUIDs validos", () => {
    const r = editarSkillsTransversalSchema.safeParse({
      skillIds: ["31111111-1111-1111-1111-111111111111"],
    })
    expect(r.success).toBe(true)
  })

  it("rechaza propiedades extra (.strict)", () => {
    const r = editarSkillsTransversalSchema.safeParse({
      skillIds: ["31111111-1111-1111-1111-111111111111"],
      extra: "no",
    })
    expect(r.success).toBe(false)
  })
})
