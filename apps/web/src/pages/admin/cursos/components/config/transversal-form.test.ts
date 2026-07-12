import type { TransversalResponse } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  FORM_TRANSVERSAL_DEFECTO,
  type FormTransversal,
  baselineDesdeRespuesta,
  construirInputTransversal,
  esFormModificado,
  esFormValido,
} from "./transversal-form"

const RESP: TransversalResponse = {
  transversalId: "11111111-1111-4111-8111-111111111111",
  cursoId: "22222222-2222-4222-8222-222222222222",
  descripcion: "<p>Construye un panel.</p>",
  umbralAprobacion: 75,
  intentosMax: 5,
  pesosCapas: { tests: 50, cualitativa: 30, comprension: 20 },
  capasActivas: { tests: true, cualitativa: true, comprension: false },
  skillsQueMide: [
    { skillId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", nombre: "NestJS", areaId: "area-1" },
    { skillId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", nombre: "React", areaId: "area-2" },
  ],
  criteriosEvaluacion: ["README claro", "Estructura ordenada"],
}

const activo = (over: Partial<FormTransversal> = {}): FormTransversal => ({
  activo: true,
  descripcion: "<p>x</p>",
  umbralAprobacion: 70,
  intentosMax: 3,
  pesoCapaTests: 40,
  pesoCapaCualitativa: 40,
  pesoCapaComprension: 20,
  capaTestsActiva: true,
  capaCualitativaActiva: true,
  capaComprensionActiva: true,
  skillsQueMideIds: [],
  criteriosEvaluacion: [],
  ...over,
})

describe("baselineDesdeRespuesta", () => {
  it("mapea brief, umbral, pesos, capas y skills del GET admin", () => {
    const base = baselineDesdeRespuesta(RESP)
    expect(base.activo).toBe(true)
    expect(base.descripcion).toBe("<p>Construye un panel.</p>")
    expect(base.umbralAprobacion).toBe(75)
    expect(base.intentosMax).toBe(5)
    expect(base.pesoCapaTests).toBe(50)
    expect(base.capaComprensionActiva).toBe(false)
    expect(base.skillsQueMideIds).toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ])
    expect(base.criteriosEvaluacion).toEqual(["README claro", "Estructura ordenada"])
  })
})

describe("esFormValido", () => {
  it("un transversal inactivo siempre es válido", () => {
    expect(esFormValido(FORM_TRANSVERSAL_DEFECTO)).toBe(true)
  })

  it("el default de un curso nuevo trae máximo de intentos 3", () => {
    expect(FORM_TRANSVERSAL_DEFECTO.intentosMax).toBe(3)
  })

  it("activo con brief vacío (o solo espacios) es inválido", () => {
    expect(esFormValido(activo({ descripcion: "   " }))).toBe(false)
  })

  it("activo con brief presente es válido (los pesos ya no los edita el admin)", () => {
    expect(esFormValido(activo())).toBe(true)
  })
})

describe("esFormModificado", () => {
  it("false cuando el form es idéntico al baseline", () => {
    const base = activo()
    expect(esFormModificado(base, base)).toBe(false)
  })

  it("detecta cambio de brief", () => {
    const base = activo()
    expect(esFormModificado(activo({ descripcion: "<p>otro</p>" }), base)).toBe(true)
  })

  it("detecta cambio en el máximo de intentos", () => {
    const base = activo({ intentosMax: 3 })
    expect(esFormModificado(activo({ intentosMax: 5 }), base)).toBe(true)
  })

  it("detecta cambio en el conjunto de skills sin importar el orden", () => {
    const base = activo({ skillsQueMideIds: ["s1", "s2"] })
    expect(esFormModificado(activo({ skillsQueMideIds: ["s2", "s1"] }), base)).toBe(false)
    expect(esFormModificado(activo({ skillsQueMideIds: ["s1"] }), base)).toBe(true)
  })

  it("desactivar respecto a un baseline activo cuenta como modificación", () => {
    const base = activo()
    expect(esFormModificado(activo({ activo: false }), base)).toBe(true)
  })

  it("detecta cambio en la lista a evaluar, respetando el orden", () => {
    const base = activo({ criteriosEvaluacion: ["a", "b"] })
    expect(esFormModificado(activo({ criteriosEvaluacion: ["a", "b"] }), base)).toBe(false)
    expect(esFormModificado(activo({ criteriosEvaluacion: ["b", "a"] }), base)).toBe(true)
    expect(esFormModificado(activo({ criteriosEvaluacion: ["a"] }), base)).toBe(true)
  })

  it("un ítem vacío o en blanco no marca la lista como modificada", () => {
    const base = activo({ criteriosEvaluacion: ["a"] })
    expect(esFormModificado(activo({ criteriosEvaluacion: ["a", "  "] }), base)).toBe(false)
    expect(esFormModificado(activo({ criteriosEvaluacion: ["a", ""] }), base)).toBe(false)
  })
})

describe("construirInputTransversal", () => {
  it("al desactivar solo envía { activo: false }", () => {
    expect(construirInputTransversal(activo({ activo: false }))).toEqual({ activo: false })
  })

  it("al activar envía brief, umbral, skills y colapsa a una sola capa IA", () => {
    // El form entra con el modelo viejo de 3 capas (40/40/20, todas activas);
    // construirInput debe normalizarlo a una capa (cualitativa 100/activa).
    const input = construirInputTransversal(
      activo({ skillsQueMideIds: ["s1", "s2"], intentosMax: 4 }),
    )
    expect(input).toMatchObject({
      activo: true,
      descripcion: "<p>x</p>",
      umbralAprobacion: 70,
      intentosMax: 4,
      pesoCapaTests: 0,
      pesoCapaCualitativa: 100,
      pesoCapaComprension: 0,
      capaTestsActiva: false,
      capaCualitativaActiva: true,
      capaComprensionActiva: false,
      skillsQueMideIds: ["s1", "s2"],
    })
  })

  it("descarta ítems vacíos/en blanco de la lista a evaluar al construir el input", () => {
    const input = construirInputTransversal(
      activo({ criteriosEvaluacion: ["  README claro ", "", "   ", "Tests"] }),
    )
    expect(input).toMatchObject({ criteriosEvaluacion: ["README claro", "Tests"] })
  })
})
