import { describe, expect, it } from "vitest"
import { construirTransversalPorRevisar } from "./transversal-por-revisar.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

const PAYLOAD = {
  intentoTransversalId: "8f5fe4fa-215f-498d-8e56-1537b2c673c7",
  cursoId: "c-1",
  cursoTitulo: "Fundamentos Full-Stack",
  colaboradorNombre: "Ada Lovelace",
}

describe("construirTransversalPorRevisar", () => {
  it("subject incluye colaborador y curso", () => {
    const r = construirTransversalPorRevisar(PAYLOAD, CONTEXTO)
    expect(r.subject).toContain("Ada Lovelace")
    expect(r.subject).toContain("Fundamentos Full-Stack")
  })

  it("el CTA apunta al detalle del intento a revisar", () => {
    const r = construirTransversalPorRevisar(PAYLOAD, CONTEXTO)
    const url = `${CONTEXTO.appBaseUrl}/admin/intentos-transversal/${PAYLOAD.intentoTransversalId}`
    expect(r.html).toContain(url)
    expect(r.text).toContain(url)
  })

  it("incluye el pie de preferencias por ser silenciable", () => {
    const r = construirTransversalPorRevisar(PAYLOAD, CONTEXTO)
    expect(r.html).toContain("/preferencias-notificaciones")
    expect(r.text).toContain("/preferencias-notificaciones")
  })

  it("escapa caracteres HTML peligrosos en el nombre del colaborador", () => {
    const r = construirTransversalPorRevisar(
      { ...PAYLOAD, colaboradorNombre: '<img src="x">' },
      CONTEXTO,
    )
    expect(r.html).toContain("&lt;img")
    expect(r.html).toContain("&quot;x&quot;")
  })
})
