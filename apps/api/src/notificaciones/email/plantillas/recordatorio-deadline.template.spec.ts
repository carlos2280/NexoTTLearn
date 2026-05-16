import { describe, expect, it } from "vitest"
import { construirRecordatorioDeadline } from "./recordatorio-deadline.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirRecordatorioDeadline", () => {
  it("variante 7 dias: subject menciona '7 dias' y body el horizonte completo", () => {
    const r = construirRecordatorioDeadline(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "Curso A",
        fechaDeadline: "2026-06-01",
        diasRestantes: 7,
      },
      CONTEXTO,
    )
    expect(r.subject).toContain("7 dias")
    expect(r.subject).toContain("Curso A")
    expect(r.html).toContain("en 7 dias")
    expect(r.html).toContain("2026-06-01")
    expect(r.html).toContain("/preferencias-notificaciones")
    expect(r.html).toContain("/plan")
    expect(r.text).toContain("en 7 dias")
  })

  it("variante 1 dia: subject menciona 'manana' y body usa el copy urgente", () => {
    const r = construirRecordatorioDeadline(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: "Curso B",
        fechaDeadline: "2026-05-15",
        diasRestantes: 1,
      },
      CONTEXTO,
    )
    expect(r.subject).toContain("manana")
    expect(r.html).toContain("vence manana")
    expect(r.text).toContain("vence manana")
  })

  it("escapa caracteres HTML peligrosos en titulo y deadline", () => {
    const r = construirRecordatorioDeadline(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: 'Curso "X" <script>',
        fechaDeadline: "2026-05-15",
        diasRestantes: 7,
      },
      CONTEXTO,
    )
    expect(r.html).toContain("&quot;X&quot;")
    expect(r.html).toContain("&lt;script&gt;")
    // El text crudo conserva los originales (no se renderiza como HTML).
    expect(r.text).toContain('Curso "X" <script>')
  })

  it("trunca titulo de >200 caracteres en HTML y text", () => {
    const tituloLargo = "Z".repeat(300)
    const r = construirRecordatorioDeadline(
      {
        asignacionId: "a1",
        cursoId: "c1",
        cursoTitulo: tituloLargo,
        fechaDeadline: "2026-05-15",
        diasRestantes: 1,
      },
      CONTEXTO,
    )
    expect(r.html.includes("Z".repeat(201))).toBe(false)
    expect(r.text.includes("Z".repeat(201))).toBe(false)
  })
})
