import { describe, expect, it } from "vitest"
import { esEntrevistaIaDisponiblePayload } from "../../payload/entrevista-ia-disponible.payload"
import { construirEntrevistaIaDisponible } from "./entrevista-ia-disponible.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirEntrevistaIaDisponible", () => {
  it("subject en espanol incluye cursoTitulo", () => {
    const r = construirEntrevistaIaDisponible(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "Python avanzado",
        intentoEntrevistaIaId: "i1",
      },
      CONTEXTO,
    )
    expect(r.subject).toBe('Entrevista IA disponible: "Python avanzado"')
    expect(r.html).toContain("Python avanzado")
    expect(r.text).toContain("Python avanzado")
  })

  it("incluye CTA al /bandeja absoluto", () => {
    const r = construirEntrevistaIaDisponible(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X", intentoEntrevistaIaId: "i1" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/bandeja")
    expect(r.text).toContain("https://app.nexott.test/bandeja")
  })

  it("silenciable — incluye pie con link a preferencias-notificaciones", () => {
    const r = construirEntrevistaIaDisponible(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X", intentoEntrevistaIaId: "i1" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/preferencias-notificaciones")
    expect(r.text).toContain("https://app.nexott.test/preferencias-notificaciones")
  })

  it("escapa caracteres HTML en cursoTitulo", () => {
    const r = construirEntrevistaIaDisponible(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "<script>alert(1)</script>",
        intentoEntrevistaIaId: "i1",
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>alert(1)</script>")
    expect(r.html).toContain("&lt;script&gt;")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esEntrevistaIaDisponiblePayload(null)).toBe(false)
    expect(esEntrevistaIaDisponiblePayload({})).toBe(false)
    expect(
      esEntrevistaIaDisponiblePayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
      }),
    ).toBe(false)
    expect(
      esEntrevistaIaDisponiblePayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        intentoEntrevistaIaId: 5,
      }),
    ).toBe(false)
    expect(
      esEntrevistaIaDisponiblePayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        intentoEntrevistaIaId: "i1",
      }),
    ).toBe(true)
  })
})
