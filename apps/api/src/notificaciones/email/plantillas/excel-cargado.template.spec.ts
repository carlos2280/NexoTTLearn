import { describe, expect, it } from "vitest"
import { esExcelCargadoPayload } from "../../payload/excel-cargado.payload"
import { construirExcelCargado } from "./excel-cargado.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirExcelCargado", () => {
  it("subject fijo en espanol", () => {
    const r = construirExcelCargado(
      {
        cursoId: "c1",
        cargaId: "ca1",
        skillsActualizadas: 12,
        colaboradoresActualizados: 4,
        planesMarcadosDesactualizados: 3,
      },
      CONTEXTO,
    )
    expect(r.subject).toBe("Carga de evaluacion inicial completada")
  })

  it("incluye contadores en HTML y text", () => {
    const r = construirExcelCargado(
      {
        cursoId: "c1",
        cargaId: "ca1",
        skillsActualizadas: 12,
        colaboradoresActualizados: 4,
        planesMarcadosDesactualizados: 3,
      },
      CONTEXTO,
    )
    expect(r.html).toContain("Skills actualizadas: 12")
    expect(r.html).toContain("Colaboradores afectados: 4")
    expect(r.html).toContain("Planes marcados desactualizados: 3")
    expect(r.text).toContain("Skills actualizadas: 12")
    expect(r.text).toContain("Colaboradores afectados: 4")
    expect(r.text).toContain("Planes marcados desactualizados: 3")
  })

  it("critico — NO incluye pie con link a preferencias-notificaciones", () => {
    const r = construirExcelCargado(
      {
        cursoId: "c1",
        cargaId: "ca1",
        skillsActualizadas: 1,
        colaboradoresActualizados: 1,
        planesMarcadosDesactualizados: 0,
      },
      CONTEXTO,
    )
    expect(r.html).not.toContain("preferencias-notificaciones")
    expect(r.text).not.toContain("preferencias-notificaciones")
  })

  it("incluye CTA a /admin/cursos/<cursoId>", () => {
    const r = construirExcelCargado(
      {
        cursoId: "abc-123",
        cargaId: "ca1",
        skillsActualizadas: 0,
        colaboradoresActualizados: 0,
        planesMarcadosDesactualizados: 0,
      },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/admin/cursos/abc-123")
    expect(r.text).toContain("https://app.nexott.test/admin/cursos/abc-123")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esExcelCargadoPayload(null)).toBe(false)
    expect(esExcelCargadoPayload({})).toBe(false)
    expect(
      esExcelCargadoPayload({
        cursoId: "c1",
        cargaId: "ca1",
        skillsActualizadas: 1,
        colaboradoresActualizados: 1,
      }),
    ).toBe(false)
    expect(
      esExcelCargadoPayload({
        cursoId: "c1",
        cargaId: "ca1",
        skillsActualizadas: "1",
        colaboradoresActualizados: 1,
        planesMarcadosDesactualizados: 0,
      }),
    ).toBe(false)
    expect(
      esExcelCargadoPayload({
        cursoId: "c1",
        cargaId: "ca1",
        skillsActualizadas: 1,
        colaboradoresActualizados: 1,
        planesMarcadosDesactualizados: 0,
      }),
    ).toBe(true)
  })
})
