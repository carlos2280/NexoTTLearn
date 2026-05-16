import { describe, expect, it } from "vitest"
import { construirCentroRevision } from "./centro-revision.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirCentroRevision", () => {
  it("subject incluye el total y body el desglose por tipo", () => {
    const r = construirCentroRevision(
      {
        totalPendientes: 5,
        porTipo: { transversales: 3, entrevistasIa: 2 },
        fechaCorte: "2026-05-13",
      },
      CONTEXTO,
    )
    expect(r.subject).toBe("Centro de revision: 5 pendientes")
    expect(r.html).toContain("Transversales con capas pendientes: 3")
    expect(r.html).toContain("Entrevistas IA con ajuste admin pendiente: 2")
    expect(r.html).toContain("2026-05-13")
    expect(r.html).toContain("/admin/centro-revision")
    expect(r.html).toContain("/preferencias-notificaciones")
    expect(r.text).toContain("- Transversales con capas pendientes: 3")
    expect(r.text).toContain("- Entrevistas IA con ajuste admin pendiente: 2")
  })

  it("link del CTA apunta al Centro de revision de admin", () => {
    const r = construirCentroRevision(
      {
        totalPendientes: 1,
        porTipo: { transversales: 1, entrevistasIa: 0 },
        fechaCorte: "2026-05-13",
      },
      CONTEXTO,
    )
    expect(r.html).toContain(`${CONTEXTO.appBaseUrl}/admin/centro-revision`)
    expect(r.text).toContain(`${CONTEXTO.appBaseUrl}/admin/centro-revision`)
  })

  it("escapa caracteres HTML peligrosos en fechaCorte", () => {
    const r = construirCentroRevision(
      {
        totalPendientes: 1,
        porTipo: { transversales: 1, entrevistasIa: 0 },
        fechaCorte: '<img src="x">',
      },
      CONTEXTO,
    )
    expect(r.html).toContain("&lt;img")
    expect(r.html).toContain("&quot;x&quot;")
  })

  it("incluye el pie de preferencias por ser silenciable", () => {
    const r = construirCentroRevision(
      {
        totalPendientes: 2,
        porTipo: { transversales: 2, entrevistasIa: 0 },
        fechaCorte: "2026-05-13",
      },
      CONTEXTO,
    )
    expect(r.html).toContain("/preferencias-notificaciones")
    expect(r.text).toContain("/preferencias-notificaciones")
  })
})
