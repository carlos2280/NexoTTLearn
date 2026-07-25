import { describe, expect, it } from "vitest"
import {
  ROLES_FILTRO,
  estadosDisponibles,
  etiquetaRolFila,
  parsearEstado,
  parsearRol,
} from "./avance-curso.filtros"

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

describe("estadosDisponibles", () => {
  it("ofrece los estados del enum de asignado", () => {
    expect(estadosDisponibles("ASIGNADO").map((e) => e.id)).toEqual([
      "ASIGNADO",
      "EN_PROGRESO",
      "LISTO",
      "APTO",
      "NO_APTO",
      "RETIRADO",
    ])
  })

  it("ofrece los estados del enum de voluntario", () => {
    expect(estadosDisponibles("VOLUNTARIO").map((e) => e.id)).toEqual([
      "INSCRITO",
      "EN_PROGRESO",
      "LISTO",
      "COMPLETADO",
      "RETIRADO",
    ])
  })

  it("para TODOS une ambos enums sin duplicar los compartidos", () => {
    const ids = estadosDisponibles("TODOS").map((e) => e.id)
    expect(ids).toEqual([
      "ASIGNADO",
      "EN_PROGRESO",
      "LISTO",
      "APTO",
      "NO_APTO",
      "RETIRADO",
      "INSCRITO",
      "COMPLETADO",
    ])
    // EN_PROGRESO/LISTO/RETIRADO estan en los dos enums: no se repiten.
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("parsearEstado", () => {
  it("acepta un estado valido para el rol", () => {
    expect(parsearEstado("APTO", "ASIGNADO")).toBe("APTO")
    expect(parsearEstado("COMPLETADO", "VOLUNTARIO")).toBe("COMPLETADO")
    expect(parsearEstado("COMPLETADO", "TODOS")).toBe("COMPLETADO")
  })

  it("cae a '' (todos) cuando el estado no aplica al rol", () => {
    // APTO no existe en el enum de voluntario.
    expect(parsearEstado("APTO", "VOLUNTARIO")).toBe("")
    // INSCRITO no existe en el enum de asignado.
    expect(parsearEstado("INSCRITO", "ASIGNADO")).toBe("")
  })

  it("cae a '' cuando esta ausente o es basura", () => {
    expect(parsearEstado(null, "ASIGNADO")).toBe("")
    expect(parsearEstado("", "ASIGNADO")).toBe("")
    expect(parsearEstado("basura", "TODOS")).toBe("")
    expect(parsearEstado("apto", "ASIGNADO")).toBe("") // case-sensitive
  })
})
