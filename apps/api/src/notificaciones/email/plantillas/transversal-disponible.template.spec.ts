import { describe, expect, it } from "vitest"
import { esTransversalDisponiblePayload } from "../../payload/transversal-disponible.payload"
import { construirTransversalDisponible } from "./transversal-disponible.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirTransversalDisponible", () => {
  it("subject en espanol incluye cursoTitulo", () => {
    const r = construirTransversalDisponible(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "Python avanzado",
        intentoTransversalId: "i1",
      },
      CONTEXTO,
    )
    expect(r.subject).toBe('Proyecto transversal disponible: "Python avanzado"')
    expect(r.html).toContain("Python avanzado")
    expect(r.text).toContain("Python avanzado")
  })

  it("incluye CTA al /bandeja absoluto", () => {
    const r = construirTransversalDisponible(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X", intentoTransversalId: "i1" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/bandeja")
    expect(r.text).toContain("https://app.nexott.test/bandeja")
  })

  it("silenciable — incluye pie con link a preferencias-notificaciones", () => {
    const r = construirTransversalDisponible(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X", intentoTransversalId: "i1" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/preferencias-notificaciones")
    expect(r.text).toContain("https://app.nexott.test/preferencias-notificaciones")
  })

  it("escapa caracteres HTML en cursoTitulo", () => {
    const r = construirTransversalDisponible(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "<script>alert(1)</script>",
        intentoTransversalId: "i1",
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>alert(1)</script>")
    expect(r.html).toContain("&lt;script&gt;")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esTransversalDisponiblePayload(null)).toBe(false)
    expect(esTransversalDisponiblePayload({})).toBe(false)
    expect(
      esTransversalDisponiblePayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
      }),
    ).toBe(false)
    expect(
      esTransversalDisponiblePayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        intentoTransversalId: 9,
      }),
    ).toBe(false)
    expect(
      esTransversalDisponiblePayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        intentoTransversalId: "i1",
      }),
    ).toBe(true)
  })
})
