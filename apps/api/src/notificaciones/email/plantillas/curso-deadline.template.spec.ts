import { describe, expect, it } from "vitest"
import { construirCursoDeadline } from "./curso-deadline.template"

describe("construirCursoDeadline", () => {
  const contexto = { appBaseUrl: "https://app.example.com" }

  it("incluye el titulo escapado y el link al detalle admin", () => {
    const r = construirCursoDeadline(
      {
        cursoId: "11111111-1111-1111-1111-111111111111",
        cursoTitulo: 'Curso "AI 101" <X>',
        fechaDeadline: "2026-05-12",
      },
      contexto,
    )
    expect(r.subject).toContain("AI 101")
    expect(r.html).toContain("&quot;")
    expect(r.html).toContain("&lt;X&gt;")
    expect(r.html).toContain(
      "https://app.example.com/admin/cursos/11111111-1111-1111-1111-111111111111",
    )
    expect(r.html).toContain("/preferencias-notificaciones")
    expect(r.text).toContain('Curso "AI 101" <X>')
    expect(r.text).toContain("2026-05-12")
  })

  it("trunca el titulo a 200 caracteres en subject y body", () => {
    const tituloLargo = "A".repeat(300)
    const r = construirCursoDeadline(
      {
        cursoId: "22222222-2222-2222-2222-222222222222",
        cursoTitulo: tituloLargo,
        fechaDeadline: "2026-05-12",
      },
      contexto,
    )
    expect(r.subject.length).toBeLessThanOrEqual(280)
    expect(r.html.includes("A".repeat(201))).toBe(false)
  })
})
