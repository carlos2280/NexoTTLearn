import { describe, expect, it } from "vitest"
import { normalizarEncabezadosLeccion } from "./sanitize-html"

describe("normalizarEncabezadosLeccion", () => {
  it("degrada h1 y h2 a h3 para no competir con el título de la sección", () => {
    const html = "<h1>Tema</h1><p>texto</p><h2>Subtema</h2>"
    expect(normalizarEncabezadosLeccion(html)).toBe("<h3>Tema</h3><p>texto</p><h3>Subtema</h3>")
  })

  it("degrada h4, h5 y h6 a h3 (evita niveles huérfanos sin estilo)", () => {
    const html = "<h4>a</h4><h5>b</h5><h6>c</h6>"
    expect(normalizarEncabezadosLeccion(html)).toBe("<h3>a</h3><h3>b</h3><h3>c</h3>")
  })

  it("deja h3 intacto", () => {
    const html = "<h3>ya es h3</h3>"
    expect(normalizarEncabezadosLeccion(html)).toBe("<h3>ya es h3</h3>")
  })

  it("preserva los atributos del encabezado al degradarlo", () => {
    const html = '<h2 class="destacado">Título</h2>'
    expect(normalizarEncabezadosLeccion(html)).toBe('<h3 class="destacado">Título</h3>')
  })

  it("no toca el texto ni otras etiquetas", () => {
    const html = "<p>Un <strong>h2</strong> en el texto no es un encabezado.</p>"
    expect(normalizarEncabezadosLeccion(html)).toBe(html)
  })

  it("maneja HTML sin encabezados sin cambios", () => {
    const html = "<p>solo prosa</p><ul><li>ítem</li></ul>"
    expect(normalizarEncabezadosLeccion(html)).toBe(html)
  })
})
