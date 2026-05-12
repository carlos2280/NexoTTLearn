import { ConflictException } from "@nestjs/common"
import { snapshotSeccionesBaseV1Schema } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  type SeccionParaSnapshot,
  construirRubricaSnapshot,
  construirSnapshotSeccionesBase,
} from "./snapshot-helpers"

const SKILL_ID = "30000000-0000-0000-0000-000000000001"
const AREA_ID = "a0000000-0000-0000-0000-000000000001"
const SECCION_ID = "5e000000-0000-0000-0000-000000000001"
const BLOQUE_ID = "b1000000-0000-0000-0000-000000000001"

function seccionMock(opciones: {
  bloques: Array<{ tipo: string; contenido: Record<string, unknown> }>
}): SeccionParaSnapshot {
  return {
    id: SECCION_ID,
    titulo: "Seccion test",
    modulo: { titulo: "Modulo test" },
    skills: [{ skill: { id: SKILL_ID, etiquetaVisible: "skill-x", areaId: AREA_ID } }],
    bloques: opciones.bloques.map((b, idx) => ({
      id: `${BLOQUE_ID.slice(0, -1)}${idx + 1}`,
      tipo: b.tipo,
      contenido: b.contenido as unknown as SeccionParaSnapshot["bloques"][number]["contenido"],
    })),
  }
}

describe("construirSnapshotSeccionesBase (D-S8-D1)", () => {
  it("construye snapshot v1 valido con bloques mapeados al enum del shared-types", () => {
    const snapshot = construirSnapshotSeccionesBase([
      seccionMock({
        bloques: [
          { tipo: "PARRAFO", contenido: { titulo: "Intro", resumen: "Texto corto." } },
          { tipo: "QUIZ", contenido: { titulo: "Quiz 1" } },
          { tipo: "VIDEO", contenido: { titulo: "Video lecturas" } },
        ],
      }),
    ])
    expect(snapshot.version).toBe(1)
    expect(snapshot.secciones).toHaveLength(1)
    const secc = snapshot.secciones[0]
    expect(secc?.bloques.map((b) => b.tipo)).toEqual(["CONTENIDO_TEXTO", "QUIZ", "CONTENIDO_VIDEO"])
    expect(secc?.skillsEnsenadas).toHaveLength(1)
  })

  it("pasa el schema canonico shared-types", () => {
    const snapshot = construirSnapshotSeccionesBase([
      seccionMock({ bloques: [{ tipo: "PARRAFO", contenido: { titulo: "x" } }] }),
    ])
    expect(snapshotSeccionesBaseV1Schema.safeParse(snapshot).success).toBe(true)
  })

  it("trunca resumenes largos a 500 chars", () => {
    const textoLargo = "x".repeat(600)
    const snapshot = construirSnapshotSeccionesBase([
      seccionMock({
        bloques: [{ tipo: "PARRAFO", contenido: { titulo: "t", resumen: textoLargo } }],
      }),
    ])
    const resumen = snapshot.secciones[0]?.bloques[0]?.resumen ?? ""
    expect(resumen.length).toBeLessThanOrEqual(500)
    expect(resumen.endsWith("...")).toBe(true)
  })

  it("0 secciones -> 409 PLAN_VACIO_PARA_ENTREVISTA", () => {
    expect(() => construirSnapshotSeccionesBase([])).toThrow(ConflictException)
  })
})

describe("construirRubricaSnapshot", () => {
  it("construye payload v1 valido", () => {
    const r = construirRubricaSnapshot({
      umbralAprobacion: 70,
      filosofia: "PREPARACION",
      profundidad: "SEMI_SENIOR",
      duracionMinutos: 30,
      tono: "CONVERSACIONAL",
      areas: [{ areaId: AREA_ID, peso: 100 }],
    })
    expect(r.version).toBe(1)
    expect(r.areas).toEqual([{ areaId: AREA_ID, peso: 100 }])
  })

  it("0 areas -> 409 RUBRICA_NO_CONFIGURADA", () => {
    expect(() =>
      construirRubricaSnapshot({
        umbralAprobacion: 70,
        filosofia: "PREPARACION",
        profundidad: "JUNIOR",
        duracionMinutos: 15,
        tono: "FORMAL",
        areas: [],
      }),
    ).toThrow(ConflictException)
  })
})
