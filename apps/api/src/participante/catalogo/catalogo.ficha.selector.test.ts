// Tests del selector de la ficha. Puro: sin PrismaService.

import { describe, expect, it } from "vitest"
import { construirFichaResponse } from "./catalogo.ficha.selector"
import type { CursoFichaRow } from "./catalogo.types"

function row(overrides: Partial<CursoFichaRow> = {}): CursoFichaRow {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "react-101",
    titulo: "React 101",
    descripcion: "Aprende los fundamentos de React.",
    empresaCliente: "Cliente Demo",
    duracionEstimada: "10 horas",
    totalModulos: 6,
    areaPrincipal: {
      id: "44444444-4444-4444-8444-444444444444",
      nombre: "Frontend",
      color: "#ff7a59",
    },
    areasConModulos: [
      {
        areaId: "44444444-4444-4444-8444-444444444444",
        nombre: "Frontend",
        color: "#ff7a59",
        modulos: [
          { id: "m1", titulo: "Intro", orden: 0, cantidadSecciones: 3 },
          { id: "m2", titulo: "Hooks", orden: 1, cantidadSecciones: 4 },
        ],
      },
    ],
    tieneTransversal: true,
    tieneEntrevistaIA: false,
    yaInscritoActivo: false,
    ...overrides,
  }
}

describe("construirFichaResponse", () => {
  it("mapea el hero con gradiente derivado del slug", () => {
    const r = construirFichaResponse(row())
    expect(r.hero.titulo).toBe("React 101")
    expect(r.hero.icono).toBe("react")
    expect(r.hero.gradiente).toMatch(/violet|indigo|emerald|rose|sky|amber|fuchsia|slate/)
    expect(r.hero.esRecomendado).toBe(false)
  })

  it("descripcionLarga retorna el texto completo sin truncar", () => {
    const larga = "x".repeat(500)
    const r = construirFichaResponse(row({ descripcion: larga }))
    expect(r.descripcionLarga).toBe(larga)
    // descripcionCorta del hero si truncado
    expect(r.hero.descripcionCorta.length).toBeLessThanOrEqual(160)
  })

  it("objetivos null en MVP (no modelado en schema)", () => {
    const r = construirFichaResponse(row())
    expect(r.objetivos).toBeNull()
  })

  it("areasConModulos se mapea preservando orden y cantidadSecciones", () => {
    const r = construirFichaResponse(row())
    expect(r.areasConModulos).toHaveLength(1)
    const area = r.areasConModulos[0]
    expect(area?.modulos).toHaveLength(2)
    expect(area?.modulos[0]?.cantidadSecciones).toBe(3)
    expect(area?.modulos[1]?.titulo).toBe("Hooks")
  })

  it("hitos refleja los flags del row", () => {
    const r = construirFichaResponse(row({ tieneTransversal: false, tieneEntrevistaIA: true }))
    expect(r.hitos).toEqual({ tieneTransversal: false, tieneEntrevistaIA: true })
  })

  it("vistaCursoHref es null cuando no esta inscrito", () => {
    const r = construirFichaResponse(row({ yaInscritoActivo: false }))
    expect(r.yaInscrito).toBe(false)
    expect(r.vistaCursoHref).toBeNull()
  })

  it("vistaCursoHref apunta a /cursos/{slug} cuando ya esta inscrito", () => {
    const r = construirFichaResponse(row({ yaInscritoActivo: true }))
    expect(r.yaInscrito).toBe(true)
    expect(r.vistaCursoHref).toBe("/cursos/react-101")
  })

  it("area null cuando el curso no tiene modulos", () => {
    const r = construirFichaResponse(row({ areaPrincipal: null, areasConModulos: [] }))
    expect(r.hero.area).toBeNull()
    expect(r.areasConModulos).toEqual([])
  })

  it("fallback de descripcionCorta usa empresaCliente cuando descripcion es null", () => {
    const r = construirFichaResponse(row({ descripcion: null }))
    expect(r.hero.descripcionCorta).toBe("Curso para Cliente Demo")
    expect(r.descripcionLarga).toBeNull()
  })
})
