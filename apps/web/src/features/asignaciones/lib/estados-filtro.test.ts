import { describe, expect, it } from "vitest"
import {
  ESTADO_ACTIVOS,
  ESTADO_TODOS,
  estadosDisponibles,
  opcionesSelectorEstado,
  parsearEstado,
  parsearSeleccionEstado,
  resolverFiltroEstado,
} from "./estados-filtro"

describe("resolverFiltroEstado", () => {
  it("por defecto (Activos) no acota por estado y oculta a los retirados", () => {
    expect(resolverFiltroEstado(ESTADO_ACTIVOS)).toEqual({
      estado: undefined,
      incluirRetirados: false,
    })
  })

  it("'Todos' no acota por estado pero SI trae a los retirados", () => {
    expect(resolverFiltroEstado(ESTADO_TODOS)).toEqual({
      estado: undefined,
      incluirRetirados: true,
    })
  })

  it("pedir Retirado gana sobre el ocultamiento: si no, el filtro saldria siempre vacio", () => {
    expect(resolverFiltroEstado("RETIRADO")).toEqual({
      estado: "RETIRADO",
      incluirRetirados: true,
    })
  })

  it("un estado concreto acota por ese estado", () => {
    expect(resolverFiltroEstado("EN_PROGRESO")).toEqual({
      estado: "EN_PROGRESO",
      incluirRetirados: true,
    })
  })

  it("un valor desconocido cae al default seguro, no a mostrar retirados", () => {
    expect(resolverFiltroEstado("INVENTADO")).toEqual({
      estado: undefined,
      incluirRetirados: false,
    })
    expect(resolverFiltroEstado("")).toEqual({ estado: undefined, incluirRetirados: false })
  })
})

describe("parsearSeleccionEstado", () => {
  it("conserva los valores especiales en cualquier rol", () => {
    expect(parsearSeleccionEstado(ESTADO_ACTIVOS, "VOLUNTARIO")).toBe(ESTADO_ACTIVOS)
    expect(parsearSeleccionEstado(ESTADO_TODOS, "ASIGNADO")).toBe(ESTADO_TODOS)
  })

  it("conserva un estado que si existe en el rol nuevo", () => {
    expect(parsearSeleccionEstado("EN_PROGRESO", "VOLUNTARIO")).toBe("EN_PROGRESO")
  })

  it("cae a Activos si el estado no existe en el rol nuevo", () => {
    // APTO es de ASIGNADO; al pasar a voluntarios dejaria la tabla vacia.
    expect(parsearSeleccionEstado("APTO", "VOLUNTARIO")).toBe(ESTADO_ACTIVOS)
    expect(parsearSeleccionEstado("INSCRITO", "ASIGNADO")).toBe(ESTADO_ACTIVOS)
  })
})

describe("opcionesSelectorEstado", () => {
  it("abre con Activos y cierra con Todos, con los estados del rol en medio", () => {
    const opciones = opcionesSelectorEstado("ASIGNADO")

    expect(opciones.at(0)).toEqual({ id: ESTADO_ACTIVOS, etiqueta: "Activos" })
    expect(opciones.at(-1)?.id).toBe(ESTADO_TODOS)
    expect(opciones.map((o) => o.id)).toContain("APTO")
    expect(opciones.map((o) => o.id)).not.toContain("INSCRITO")
  })

  it("el estado ASIGNADO se lee 'Sin iniciar' para no chocar con el rol Asignado", () => {
    const opcion = opcionesSelectorEstado("ASIGNADO").find((o) => o.id === "ASIGNADO")

    expect(opcion?.etiqueta).toBe("Sin iniciar")
  })

  it("en TODOS une ambos enums sin duplicar los estados compartidos", () => {
    const ids = opcionesSelectorEstado("TODOS").map((o) => o.id)

    expect(ids.filter((id) => id === "EN_PROGRESO")).toHaveLength(1)
    expect(ids).toContain("APTO")
    expect(ids).toContain("INSCRITO")
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
