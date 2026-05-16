import { describe, expect, it } from "vitest"
import { esColaboradorListoPayload } from "../../payload/colaborador-listo.payload"
import { construirColaboradorListo } from "./colaborador-listo.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirColaboradorListo", () => {
  it("subject en espanol incluye nombre del colaborador y curso", () => {
    const r = construirColaboradorListo(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "Python avanzado",
        colaboradorId: "co1",
        colaboradorNombre: "Ana Lopez",
      },
      CONTEXTO,
    )
    expect(r.subject).toBe('Colaborador listo para cerrar: "Ana Lopez" en "Python avanzado"')
    expect(r.html).toContain("Ana Lopez")
    expect(r.html).toContain("Python avanzado")
    expect(r.text).toContain("Ana Lopez")
    expect(r.text).toContain("Python avanzado")
  })

  it("silenciable — incluye pie con link a preferencias-notificaciones", () => {
    const r = construirColaboradorListo(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        colaboradorId: "co1",
        colaboradorNombre: "Ana",
      },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/preferencias-notificaciones")
    expect(r.text).toContain("https://app.nexott.test/preferencias-notificaciones")
  })

  it("escapa caracteres HTML en colaboradorNombre y cursoTitulo", () => {
    const r = construirColaboradorListo(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "<b>Curso</b>",
        colaboradorId: "co1",
        colaboradorNombre: "<script>x</script>",
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("<script>x</script>")
    expect(r.html).toContain("&lt;script&gt;")
    expect(r.html).toContain("&lt;b&gt;Curso&lt;/b&gt;")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esColaboradorListoPayload(null)).toBe(false)
    expect(esColaboradorListoPayload({})).toBe(false)
    expect(
      esColaboradorListoPayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        colaboradorId: "co1",
      }),
    ).toBe(false)
    expect(
      esColaboradorListoPayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        colaboradorId: "co1",
        colaboradorNombre: 0,
      }),
    ).toBe(false)
    expect(
      esColaboradorListoPayload({
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "X",
        colaboradorId: "co1",
        colaboradorNombre: "Ana",
      }),
    ).toBe(true)
  })
})
