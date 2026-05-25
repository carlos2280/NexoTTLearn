import { describe, expect, it } from "vitest"
import { esModuloHuerfanoSkillPayload } from "../../payload/modulo-huerfano-skill.payload"
import { construirModuloHuerfanoSkill } from "./modulo-huerfano-skill.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirModuloHuerfanoSkill", () => {
  it("subject incluye conteo de skills y cursos", () => {
    const r = construirModuloHuerfanoSkill(
      {
        moduloId: "m1",
        cursos: [
          { cursoId: "c1", titulo: "Curso A" },
          { cursoId: "c2", titulo: "Curso B" },
        ],
        huerfanas: [
          { skillId: "s1", etiquetaVisible: "TypeScript", cursosDondeQuedaHuerfana: ["c1"] },
        ],
      },
      CONTEXTO,
    )
    expect(r.subject).toBe("Modulo archivado deja 1 skill(s) sin cobertura en 2 curso(s)")
    expect(r.html).toContain("Curso A")
    expect(r.html).toContain("TypeScript")
    expect(r.text).toContain("Curso A")
    expect(r.text).toContain("TypeScript")
  })

  it("critico — NO incluye pie con link a preferencias-notificaciones", () => {
    const r = construirModuloHuerfanoSkill(
      {
        moduloId: "m1",
        cursos: [{ cursoId: "c1", titulo: "Curso A" }],
        huerfanas: [
          { skillId: "s1", etiquetaVisible: "TypeScript", cursosDondeQuedaHuerfana: ["c1"] },
        ],
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("preferencias-notificaciones")
    expect(r.text).not.toContain("preferencias-notificaciones")
  })

  it("escapa caracteres HTML en titulos y etiquetas", () => {
    const r = construirModuloHuerfanoSkill(
      {
        moduloId: "m1",
        cursos: [{ cursoId: "c1", titulo: "<script>alert(1)</script>" }],
        huerfanas: [
          {
            skillId: "s1",
            etiquetaVisible: "<img src=x onerror=y>",
            cursosDondeQuedaHuerfana: ["c1"],
          },
        ],
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>alert(1)</script>")
    expect(r.html).not.toContain("<img src=x onerror=y>")
    expect(r.html).toContain("&lt;script&gt;")
    expect(r.html).toContain("&lt;img")
  })

  it("trunca listado a 10 elementos con resumen del resto", () => {
    const cursos = Array.from({ length: 13 }, (_, i) => ({
      cursoId: `c${i}`,
      titulo: `Curso ${i}`,
    }))
    const huerfanas = Array.from({ length: 12 }, (_, i) => ({
      skillId: `s${i}`,
      etiquetaVisible: `Skill ${i}`,
      cursosDondeQuedaHuerfana: ["c0"],
    }))
    const r = construirModuloHuerfanoSkill({ moduloId: "m1", cursos, huerfanas }, CONTEXTO)
    expect(r.html).toContain("y 3 curso(s) mas")
    expect(r.html).toContain("y 2 skill(s) mas")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esModuloHuerfanoSkillPayload(null)).toBe(false)
    expect(esModuloHuerfanoSkillPayload({})).toBe(false)
    expect(
      esModuloHuerfanoSkillPayload({ moduloId: "m1", cursos: [], huerfanas: [{ skillId: "s1" }] }),
    ).toBe(false)
    expect(
      esModuloHuerfanoSkillPayload({
        moduloId: "m1",
        cursos: [{ cursoId: "c1" }],
        huerfanas: [],
      }),
    ).toBe(false)
    expect(
      esModuloHuerfanoSkillPayload({
        moduloId: "m1",
        cursos: [{ cursoId: "c1", titulo: "X" }],
        huerfanas: [{ skillId: "s1", etiquetaVisible: "Y", cursosDondeQuedaHuerfana: ["c1"] }],
      }),
    ).toBe(true)
  })
})
