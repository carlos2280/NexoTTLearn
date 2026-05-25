import { describe, expect, it } from "vitest"
import { construirResultadoCierre } from "./resultado-cierre.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirResultadoCierre", () => {
  it("APTO produce subject y cuerpo de felicitacion", () => {
    const r = construirResultadoCierre(
      { asignacionId: "a1", cursoTitulo: "Curso Z", resultado: "APTO" },
      CONTEXTO,
    )
    expect(r.subject).toBe('Resultado de tu curso "Curso Z": APTO')
    expect(r.text).toContain("Felicitaciones")
    expect(r.html).toContain("Felicitaciones")
  })

  it("NO_APTO produce subject con espacio (NO APTO) y cuerpo orientativo", () => {
    const r = construirResultadoCierre(
      { asignacionId: "a1", cursoTitulo: "Curso Z", resultado: "NO_APTO" },
      CONTEXTO,
    )
    expect(r.subject).toBe('Resultado de tu curso "Curso Z": NO APTO')
    expect(r.text).toContain("no alcanzo el umbral requerido")
    expect(r.html).toContain("no alcanzo el umbral requerido")
  })

  it("COMPLETADO produce subject y cuerpo neutro", () => {
    const r = construirResultadoCierre(
      { asignacionId: "a1", cursoTitulo: "Curso Z", resultado: "COMPLETADO" },
      CONTEXTO,
    )
    expect(r.subject).toBe('Resultado de tu curso "Curso Z": COMPLETADO')
    expect(r.text).toContain("ha sido marcado como completado")
  })

  it("CTA absoluto al /bandeja en HTML y text (las 3 variantes)", () => {
    for (const resultado of ["APTO", "NO_APTO", "COMPLETADO"] as const) {
      const r = construirResultadoCierre(
        { asignacionId: "a1", cursoTitulo: "X", resultado },
        CONTEXTO,
      )
      expect(r.html).toContain("https://app.nexott.test/bandeja")
      expect(r.text).toContain("https://app.nexott.test/bandeja")
      expect(r.html).toContain("Ver mi bandeja")
    }
  })

  it("NO incluye link a preferencias (RESULTADO_CIERRE es critico)", () => {
    const r = construirResultadoCierre(
      { asignacionId: "a1", cursoTitulo: "X", resultado: "APTO" },
      CONTEXTO,
    )
    expect(r.html).not.toContain("preferencias-notificaciones")
    expect(r.text).not.toContain("preferencias-notificaciones")
  })

  it("escapa caracteres HTML en cursoTitulo", () => {
    const r = construirResultadoCierre(
      { asignacionId: "a1", cursoTitulo: "<b>X</b>", resultado: "APTO" },
      CONTEXTO,
    )
    expect(r.html).toContain("&lt;b&gt;X&lt;/b&gt;")
    expect(r.html).not.toContain("<b>X</b>")
  })
})
