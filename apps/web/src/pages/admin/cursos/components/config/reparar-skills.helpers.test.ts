import type { RepararSkillsCursoPreview } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"

import { lineasResumenReparacion, necesitaReparacion } from "./reparar-skills.helpers"

function preview(over: Partial<RepararSkillsCursoPreview> = {}): RepararSkillsCursoPreview {
  return {
    cursoId: "c1",
    bloques: 17,
    secciones: 40,
    skillsExigidas: 9,
    areaExigida: true,
    planes: 4,
    ...over,
  }
}

describe("necesitaReparacion", () => {
  it("es true si falta algo y false si el curso está completo", () => {
    expect(necesitaReparacion(preview())).toBe(true)
    expect(necesitaReparacion(preview({ bloques: 0, secciones: 0, skillsExigidas: 0 }))).toBe(false)
  })
})

describe("lineasResumenReparacion", () => {
  it("dice cuántos bloques, secciones y planes cambian", () => {
    expect(lineasResumenReparacion(preview())).toEqual([
      "17 preguntas o retos reciben su habilidad (hoy no se pueden responder).",
      "40 secciones entran al plan de estudio.",
      "9 habilidades y el área del curso pasan a ser exigidas.",
      "Se recalcula el plan de 4 personas asignadas; cada una recibe un aviso.",
    ])
  })

  it("usa singular y omite lo que no cambia", () => {
    expect(
      lineasResumenReparacion(
        preview({ bloques: 0, secciones: 1, skillsExigidas: 1, areaExigida: false, planes: 1 }),
      ),
    ).toEqual([
      "1 sección entra al plan de estudio.",
      "1 habilidad pasa a ser exigida.",
      "Se recalcula el plan de 1 persona asignada; recibe un aviso.",
    ])
  })

  it("sin asignados lo dice", () => {
    expect(lineasResumenReparacion(preview({ planes: 0 })).at(-1)).toBe(
      "No hay personas asignadas cuyo plan haya que recalcular.",
    )
  })
})
