import { describe, expect, it } from "vitest"
import { ROLES_FILTRO, etiquetaRolFila, parsearRol } from "./avance-curso.filtros"

describe("parsearRol", () => {
  it("acepta los roles validos tal cual", () => {
    expect(parsearRol("ASIGNADO")).toBe("ASIGNADO")
    expect(parsearRol("VOLUNTARIO")).toBe("VOLUNTARIO")
    expect(parsearRol("TODOS")).toBe("TODOS")
  })

  it("cae a ASIGNADO (default) cuando el valor esta ausente o es desconocido", () => {
    expect(parsearRol(null)).toBe("ASIGNADO")
    expect(parsearRol("")).toBe("ASIGNADO")
    expect(parsearRol("basura")).toBe("ASIGNADO")
    expect(parsearRol("asignado")).toBe("ASIGNADO") // case-sensitive: minuscula no matchea
  })
})

describe("ROLES_FILTRO", () => {
  it("ofrece Asignados primero (default), luego Voluntarios y Todos", () => {
    expect(ROLES_FILTRO.map((r) => r.id)).toEqual(["ASIGNADO", "VOLUNTARIO", "TODOS"])
  })
})

describe("etiquetaRolFila", () => {
  it("distingue voluntario de asignado", () => {
    expect(etiquetaRolFila("VOLUNTARIO")).toBe("Voluntario")
    expect(etiquetaRolFila("ASIGNADO")).toBe("Asignado")
  })
})
