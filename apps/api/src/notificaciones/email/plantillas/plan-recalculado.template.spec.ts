import { describe, expect, it } from "vitest"
import { construirPlanRecalculado } from "./plan-recalculado.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirPlanRecalculado", () => {
  it("genera subject con copy fijo y cuerpo con cursoTitulo", () => {
    const r = construirPlanRecalculado(
      { planId: "p1", asignacionId: "a1", cursoTitulo: "Python avanzado" },
      CONTEXTO,
    )
    expect(r.subject).toBe("Tu plan personal en NexoTT Learn ha sido actualizado")
    expect(r.html).toContain("Python avanzado")
    expect(r.text).toContain("Python avanzado")
  })

  it("incluye CTA al /plan absoluto en HTML y text", () => {
    const r = construirPlanRecalculado(
      { planId: "p1", asignacionId: "a1", cursoTitulo: "X" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/plan")
    expect(r.text).toContain("https://app.nexott.test/plan")
    expect(r.html).toContain("Ver mi plan")
  })

  it("incluye pie con link a preferencias-notificaciones (no critico)", () => {
    const r = construirPlanRecalculado(
      { planId: "p1", asignacionId: "a1", cursoTitulo: "X" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/preferencias-notificaciones")
    expect(r.text).toContain("https://app.nexott.test/preferencias-notificaciones")
  })

  it("escapa caracteres HTML en cursoTitulo", () => {
    const r = construirPlanRecalculado(
      { planId: "p1", asignacionId: "a1", cursoTitulo: "<script>alert(1)</script>" },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>alert(1)</script>")
    expect(r.html).toContain("&lt;script&gt;")
  })
})
