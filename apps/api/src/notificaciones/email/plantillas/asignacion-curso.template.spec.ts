import { describe, expect, it } from "vitest"
import { esAsignacionCursoPayload } from "../../payload/asignacion-curso.payload"
import { construirAsignacionCurso } from "./asignacion-curso.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirAsignacionCurso", () => {
  it("subject en espanol incluye cursoTitulo", () => {
    const r = construirAsignacionCurso(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "Python avanzado" },
      CONTEXTO,
    )
    expect(r.subject).toBe('Tienes un nuevo curso asignado: "Python avanzado"')
    expect(r.html).toContain("Python avanzado")
    expect(r.text).toContain("Python avanzado")
  })

  it("incluye CTA al /bandeja absoluto en HTML y text", () => {
    const r = construirAsignacionCurso(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/bandeja")
    expect(r.text).toContain("https://app.nexott.test/bandeja")
    expect(r.html).toContain("Ir a mi bandeja")
  })

  it("critico — NO incluye pie con link a preferencias-notificaciones", () => {
    const r = construirAsignacionCurso(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X" },
      CONTEXTO,
    )
    expect(r.html).not.toContain("preferencias-notificaciones")
    expect(r.text).not.toContain("preferencias-notificaciones")
  })

  it("escapa caracteres HTML en cursoTitulo", () => {
    const r = construirAsignacionCurso(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "<script>alert(1)</script>" },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>alert(1)</script>")
    expect(r.html).toContain("&lt;script&gt;")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esAsignacionCursoPayload(null)).toBe(false)
    expect(esAsignacionCursoPayload({})).toBe(false)
    expect(esAsignacionCursoPayload({ asignacionId: "a1", cursoId: "c1" })).toBe(false)
    expect(esAsignacionCursoPayload({ asignacionId: 123, cursoId: "c1", cursoTitulo: "X" })).toBe(
      false,
    )
    expect(esAsignacionCursoPayload({ asignacionId: "a1", cursoId: "c1", cursoTitulo: "X" })).toBe(
      true,
    )
  })
})
