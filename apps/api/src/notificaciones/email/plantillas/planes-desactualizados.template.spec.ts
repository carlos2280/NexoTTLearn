import { describe, expect, it } from "vitest"
import { esPlanesDesactualizadosPayload } from "../../payload/planes-desactualizados.payload"
import { construirPlanesDesactualizados } from "./planes-desactualizados.template"

const CONTEXTO = { appBaseUrl: "https://app.nexott.test" }

describe("construirPlanesDesactualizados", () => {
  it("driver=recarga_excel: subject menciona recarga y conteo", () => {
    const r = construirPlanesDesactualizados(
      { driver: "recarga_excel", cursoId: "c1", planesAfectados: 7 },
      CONTEXTO,
    )
    expect(r.subject).toBe("Planes desactualizados tras recarga Excel (7)")
    expect(r.html).toContain("una recarga masiva de Excel")
    expect(r.html).toContain("7 plan(es)")
    expect(r.text).toContain("una recarga masiva de Excel")
  })

  it("driver=reabrir_caso: subject menciona reapertura individual", () => {
    const r = construirPlanesDesactualizados(
      { driver: "reabrir_caso", cursoId: "c1", planesAfectados: 1 },
      CONTEXTO,
    )
    expect(r.subject).toBe("Plan desactualizado tras reapertura de caso (1)")
    expect(r.html).toContain("la reapertura de un caso individual")
    expect(r.text).toContain("la reapertura de un caso individual")
  })

  it("silenciable — incluye pie con link a preferencias-notificaciones", () => {
    const r = construirPlanesDesactualizados(
      { driver: "recarga_excel", cursoId: "c1", planesAfectados: 1 },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/preferencias-notificaciones")
    expect(r.text).toContain("https://app.nexott.test/preferencias-notificaciones")
  })

  it("incluye CTA al curso afectado", () => {
    const r = construirPlanesDesactualizados(
      { driver: "reabrir_caso", cursoId: "xyz-9", planesAfectados: 1 },
      CONTEXTO,
    )
    expect(r.html).toContain("https://app.nexott.test/admin/cursos/xyz-9")
    expect(r.text).toContain("https://app.nexott.test/admin/cursos/xyz-9")
  })

  it("type guard rechaza payloads malformados", () => {
    expect(esPlanesDesactualizadosPayload(null)).toBe(false)
    expect(esPlanesDesactualizadosPayload({})).toBe(false)
    expect(
      esPlanesDesactualizadosPayload({
        driver: "otro",
        cursoId: "c1",
        planesAfectados: 1,
      }),
    ).toBe(false)
    expect(
      esPlanesDesactualizadosPayload({
        driver: "recarga_excel",
        cursoId: "c1",
        planesAfectados: "1",
      }),
    ).toBe(false)
    expect(
      esPlanesDesactualizadosPayload({
        driver: "recarga_excel",
        cursoId: "c1",
        planesAfectados: 1,
      }),
    ).toBe(true)
    expect(
      esPlanesDesactualizadosPayload({
        driver: "reabrir_caso",
        cursoId: "c1",
        planesAfectados: 1,
      }),
    ).toBe(true)
  })
})
