import { describe, expect, it } from "vitest"
import { esCasoReabiertoPayload } from "../../payload/caso-reabierto.payload"
import { construirCasoReabierto } from "./caso-reabierto.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirCasoReabierto", () => {
  it("subject en espanol incluye cursoTitulo", () => {
    const r = construirCasoReabierto(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "Python avanzado",
        motivo: "Revision de entrega",
      },
      CONTEXTO,
    )
    expect(r.subject).toBe('Tu caso del curso "Python avanzado" ha sido reabierto')
    expect(r.html).toContain("Python avanzado")
    expect(r.text).toContain("Python avanzado")
  })

  it("muestra el motivo en HTML y text", () => {
    const r = construirCasoReabierto(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        motivo: "Revision por feedback de cliente",
      },
      CONTEXTO,
    )
    expect(r.html).toContain("Revision por feedback de cliente")
    expect(r.text).toContain("Revision por feedback de cliente")
  })

  it("incluye CTA al /bandeja absoluto", () => {
    const r = construirCasoReabierto(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X", motivo: "m" },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/bandeja")
    expect(r.text).toContain("https://app.nexott.test/bandeja")
  })

  it("critico — NO incluye pie con link a preferencias-notificaciones", () => {
    const r = construirCasoReabierto(
      { asignacionId: "a1", cursoId: "c1", cursoTitulo: "X", motivo: "m" },
      CONTEXTO,
    )
    expect(r.html).not.toContain("preferencias-notificaciones")
    expect(r.text).not.toContain("preferencias-notificaciones")
  })

  it("escapa caracteres HTML en motivo y cursoTitulo", () => {
    const r = construirCasoReabierto(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "<script>x</script>",
        motivo: "<img src=x onerror=y>",
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>x</script>")
    expect(r.html).not.toContain("<img src=x onerror=y>")
    expect(r.html).toContain("&lt;script&gt;")
    expect(r.html).toContain("&lt;img")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esCasoReabiertoPayload(null)).toBe(false)
    expect(esCasoReabiertoPayload({})).toBe(false)
    expect(esCasoReabiertoPayload({ asignacionId: "a1", cursoId: "c1", cursoTitulo: "X" })).toBe(
      false,
    )
    expect(
      esCasoReabiertoPayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        motivo: 123,
      }),
    ).toBe(false)
    expect(
      esCasoReabiertoPayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        motivo: "m",
      }),
    ).toBe(true)
  })
})
