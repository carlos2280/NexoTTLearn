import { describe, expect, it } from "vitest"

import {
  type BloqueAReparar,
  type CursoAReparar,
  bloquesSinSkill,
  planificarSeccionSkills,
} from "./reparar-skills.helpers"

function bloque(id: string, skillQueMideId: string | null, esEvaluable = true): BloqueAReparar {
  return { id, tipo: "QUIZ", esEvaluable, skillQueMideId }
}

function curso(): CursoAReparar {
  return {
    titulo: "Data Engineer - AWS",
    modulos: [
      {
        id: "m-Semana 1",
        titulo: "Semana 1",
        secciones: [
          { id: "s1", skillIds: [], bloques: [bloque("p1", null, false)] },
          { id: "s2", skillIds: [], bloques: [bloque("q1", null), bloque("q2", "k-glue")] },
        ],
      },
      {
        id: "m-Semana 2",
        titulo: "Semana 2",
        secciones: [
          { id: "s3", skillIds: ["k-ya"], bloques: [bloque("q3", "k-ya")] },
          { id: "s4", skillIds: [], bloques: [bloque("p2", null, false)] },
        ],
      },
      {
        id: "m-Solo lectura",
        titulo: "Solo lectura",
        secciones: [{ id: "s5", skillIds: [], bloques: [bloque("p3", null, false)] }],
      },
    ],
  }
}

describe("bloquesSinSkill", () => {
  it("lista solo los evaluables sin skill, con la etiqueta de su módulo", () => {
    expect(bloquesSinSkill(curso())).toEqual([
      { bloqueId: "q1", etiqueta: "Data Engineer - AWS · Semana 1" },
    ])
  })

  it("ignora tipos que no miden skill aunque digan esEvaluable", () => {
    const c = curso()
    const s = c.modulos[0]?.secciones[0]
    if (s) {
      s.bloques = [{ id: "v", tipo: "VIDEO", esEvaluable: true, skillQueMideId: null }]
    }
    expect(bloquesSinSkill(c).map((b) => b.bloqueId)).toEqual(["q1"])
  })
})

describe("planificarSeccionSkills", () => {
  // q1 ya recibió su skill por defecto antes de planificar.
  const skillDeBloque = new Map([["q1", "k-def1"]])

  it("una sección sin skills recibe las de sus bloques; una de lectura, el representante", () => {
    const filas = planificarSeccionSkills(curso(), skillDeBloque)
    expect(filas).toEqual([
      { seccionId: "s1", skillId: "k-def1" },
      { seccionId: "s2", skillId: "k-def1" },
      { seccionId: "s2", skillId: "k-glue" },
      { seccionId: "s4", skillId: "k-ya" },
    ])
  })

  it("no toca secciones que ya tienen skills ni módulos sin ninguna skill", () => {
    const filas = planificarSeccionSkills(curso(), skillDeBloque)
    expect(filas.some((f) => f.seccionId === "s3")).toBe(false)
    expect(filas.some((f) => f.seccionId === "s5")).toBe(false)
  })
})
