import { describe, expect, it } from "vitest"
import { calcularSugerencias } from "./asignaciones.sugerencias"
import {
  AREA_BE_ID,
  AREA_FE_ID,
  MODULO_FE_ID,
  buildCursoAreas,
  buildInscripcionRow,
  buildModulos,
} from "./asignaciones.test-helpers"

const cursoAreas = buildCursoAreas()
const modulos = buildModulos()

describe("calcularSugerencias · MAESTRO §7.3", () => {
  it("sin evaluacion inicial: tieneEvaluacion=false y sin sugerencias por SIN_DATO", () => {
    const inscripcion = buildInscripcionRow({})
    const r = calcularSugerencias({ inscripcion, cursoAreas, modulos, umbralBrechaNoCumple: 10 })
    expect(r.tieneEvaluacion).toBe(false)
    expect(r.sugerencias).toEqual([])
    expect(r.cumple).toEqual([])
  })

  it("nota >= objetivo → CUMPLE, no se asigna el modulo", () => {
    const inscripcion = buildInscripcionRow({ notaFe: 85, notaBe: 70 })
    const r = calcularSugerencias({ inscripcion, cursoAreas, modulos, umbralBrechaNoCumple: 10 })
    expect(r.sugerencias).toEqual([])
    expect(r.cumple.map((c) => c.areaId).sort()).toEqual([AREA_BE_ID, AREA_FE_ID].sort())
  })

  it("brecha entre 0 y umbralBrechaNoCumple → CERCA → RECOMENDADO", () => {
    const inscripcion = buildInscripcionRow({ notaFe: 65, notaBe: 70 })
    const r = calcularSugerencias({ inscripcion, cursoAreas, modulos, umbralBrechaNoCumple: 10 })
    expect(r.sugerencias).toEqual([
      { moduloId: MODULO_FE_ID, areaId: AREA_FE_ID, tipo: "RECOMENDADO", motivo: "CERCA" },
    ])
    expect(r.cumple.map((c) => c.areaId)).toEqual([AREA_BE_ID])
  })

  it("brecha >= umbralBrechaNoCumple → NO_CUMPLE → OBLIGATORIO", () => {
    const inscripcion = buildInscripcionRow({ notaFe: 50, notaBe: 70 })
    const r = calcularSugerencias({ inscripcion, cursoAreas, modulos, umbralBrechaNoCumple: 10 })
    expect(r.sugerencias).toEqual([
      { moduloId: MODULO_FE_ID, areaId: AREA_FE_ID, tipo: "OBLIGATORIO", motivo: "NO_CUMPLE" },
    ])
  })

  it("evaluacion parcial: las areas sin nota quedan SIN_DATO (sin sugerencia)", () => {
    const inscripcion = buildInscripcionRow({ notaFe: 50 })
    const r = calcularSugerencias({ inscripcion, cursoAreas, modulos, umbralBrechaNoCumple: 10 })
    expect(r.tieneEvaluacion).toBe(true)
    expect(r.sugerencias.map((s) => s.moduloId)).toEqual([MODULO_FE_ID])
  })

  it("modulo cuya area no esta en cursoAreas no recibe sugerencia", () => {
    const inscripcion = buildInscripcionRow({ notaFe: 30 })
    const modulosExtra = [
      ...modulos,
      {
        id: "m-otra",
        titulo: "Modulo de otra area",
        orden: 3,
        areaId: "00000000-0000-0000-0000-000000000aff",
        archivadoAt: null,
      },
    ]
    const r = calcularSugerencias({
      inscripcion,
      cursoAreas,
      modulos: modulosExtra,
      umbralBrechaNoCumple: 10,
    })
    expect(r.sugerencias.map((s) => s.moduloId)).toEqual([MODULO_FE_ID])
  })

  it("respeta umbralBrechaNoCumple custom (ej. 5): brecha 7 → NO_CUMPLE", () => {
    const inscripcion = buildInscripcionRow({ notaFe: 63, notaBe: 70 })
    const r = calcularSugerencias({ inscripcion, cursoAreas, modulos, umbralBrechaNoCumple: 5 })
    expect(r.sugerencias[0]).toMatchObject({ motivo: "NO_CUMPLE", tipo: "OBLIGATORIO" })
  })
})
