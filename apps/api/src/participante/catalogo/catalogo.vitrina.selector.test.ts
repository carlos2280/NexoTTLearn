// Tests del selector de la vitrina. Puro: sin PrismaService.

import { describe, expect, it } from "vitest"
import type { CursoCatalogoRow } from "./catalogo.types"
import type { VitrinaQueryResult } from "./catalogo.vitrina.query"
import { construirVitrinaResponse } from "./catalogo.vitrina.selector"

const AREA: NonNullable<CursoCatalogoRow["areaPrincipal"]> = {
  id: "11111111-1111-4111-8111-111111111111",
  nombre: "Backend",
  color: "#5b8def",
}

function row(overrides: Partial<CursoCatalogoRow> = {}): CursoCatalogoRow {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "git-avanzado",
    titulo: "Git avanzado",
    descripcion: "Branching strategies y rebase interactivo.",
    empresaCliente: "Empresa Demo",
    duracionEstimada: "8 horas",
    totalModulos: 4,
    areaPrincipal: AREA,
    ...overrides,
  }
}

function result(
  rows: CursoCatalogoRow[],
  overrides: Partial<VitrinaQueryResult> = {},
): VitrinaQueryResult {
  return {
    rows,
    nextCursor: null,
    totalDisponibles: rows.length,
    totalSinFiltros: rows.length,
    areasDisponibles: [AREA],
    ...overrides,
  }
}

describe("construirVitrinaResponse", () => {
  it("retorna lista vacia cuando no hay filas", () => {
    const r = construirVitrinaResponse(result([]))
    expect(r.items).toEqual([])
    expect(r.nextCursor).toBeNull()
    expect(r.totalDisponibles).toBe(0)
  })

  it("mapea cada fila al item con href, gradiente e icono", () => {
    const r = construirVitrinaResponse(result([row()]))
    expect(r.items).toHaveLength(1)
    const item = r.items[0]
    expect(item?.href).toBe("/catalogo/git-avanzado")
    expect(item?.gradiente).toMatch(/violet|indigo|emerald|rose|sky|amber|fuchsia|slate/)
    expect(item?.icono).toBe("git")
    expect(item?.esRecomendado).toBe(false)
    expect(item?.area?.colorHex).toBe(AREA.color)
  })

  it("usa fallback de descripcion cuando descripcion es null", () => {
    const r = construirVitrinaResponse(result([row({ descripcion: null })]))
    expect(r.items[0]?.descripcionCorta).toBe("Curso para Empresa Demo")
  })

  it("trunca descripcion larga a 160 caracteres con elipsis", () => {
    const larga = "a".repeat(200)
    const r = construirVitrinaResponse(result([row({ descripcion: larga })]))
    const corta = r.items[0]?.descripcionCorta ?? ""
    expect(corta.length).toBeLessThanOrEqual(160)
    expect(corta.endsWith("...")).toBe(true)
  })

  it("area null cuando el curso no tiene areaPrincipal", () => {
    const r = construirVitrinaResponse(result([row({ areaPrincipal: null })]))
    expect(r.items[0]?.area).toBeNull()
  })

  it("filtros incluye las 3 bandas de duracion en orden", () => {
    const r = construirVitrinaResponse(result([]))
    expect(r.filtros.duraciones.map((d) => d.id)).toEqual(["CORTA", "MEDIA", "LARGA"])
  })

  it("propaga nextCursor y totales", () => {
    const r = construirVitrinaResponse(
      result([row()], { nextCursor: "next-uuid", totalDisponibles: 30, totalSinFiltros: 50 }),
    )
    expect(r.nextCursor).toBe("next-uuid")
    expect(r.totalDisponibles).toBe(30)
    expect(r.totalSinFiltros).toBe(50)
  })

  it("instructorEmpresa usa empresaCliente del curso", () => {
    const r = construirVitrinaResponse(result([row({ empresaCliente: "ACME" })]))
    expect(r.items[0]?.instructorEmpresa).toBe("ACME")
  })
})
