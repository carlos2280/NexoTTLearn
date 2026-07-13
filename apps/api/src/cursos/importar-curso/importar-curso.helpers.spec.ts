import type { ModuloImportado, SeccionImportada } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"

import {
  esSkillFundamentos,
  etiquetasSkillDeSeccion,
  representanteDeModulo,
} from "./importar-curso.helpers"

function seccionConSkills(...etiquetas: (string | null)[]): SeccionImportada {
  return {
    titulo: "s",
    bloques: etiquetas.map((etiqueta) =>
      etiqueta
        ? { tipo: "QUIZ", contenido: {}, skillEtiqueta: etiqueta }
        : { tipo: "PARRAFO", contenido: { html: "", textoPlano: "", tiempoLecturaMin: 1 } },
    ),
  } as SeccionImportada
}

function modulo(...secciones: SeccionImportada[]): ModuloImportado {
  return { titulo: "m", descripcion: "", secciones } as ModuloImportado
}

describe("esSkillFundamentos", () => {
  it("clasifica las variantes reales de fundacionales como fundamentos", () => {
    expect(esSkillFundamentos("Testing · Fundamentos")).toBe(true)
    expect(esSkillFundamentos("TypeScript · Fundamentos senior")).toBe(true)
    expect(esSkillFundamentos("Python · Fundamentos de datos")).toBe(true)
    expect(esSkillFundamentos("Postgres · Fundamentos de producción")).toBe(true)
  })

  it("clasifica las capacidades específicas como concretas", () => {
    expect(esSkillFundamentos("Python · pandas")).toBe(false)
    expect(esSkillFundamentos("TypeScript · Narrowing y control de flujo")).toBe(false)
    expect(esSkillFundamentos("API REST · Códigos de estado y errores")).toBe(false)
  })
})

describe("representanteDeModulo", () => {
  it("elige la primera concreta en orden de aparición", () => {
    const m = modulo(
      seccionConSkills("Python · Fundamentos de datos"),
      seccionConSkills("Python · pandas"),
      seccionConSkills("Python · Datos con PySpark"),
    )
    expect(representanteDeModulo(m)).toBe("Python · pandas")
  })

  it("si no hay concretas, usa la primera fundacional", () => {
    const m = modulo(seccionConSkills("Arquitectura del panel · Fundamentos"))
    expect(representanteDeModulo(m)).toBe("Arquitectura del panel · Fundamentos")
  })

  it("si el módulo no declara skills, es null", () => {
    const m = modulo(seccionConSkills(null))
    expect(representanteDeModulo(m)).toBeNull()
  })
})

describe("etiquetasSkillDeSeccion", () => {
  const representante = "Python · pandas"

  it("usa sus concretas propias cuando las tiene", () => {
    const seccion = seccionConSkills("Python · Datos con PySpark", "Python · pandas")
    expect(etiquetasSkillDeSeccion(seccion, representante)).toEqual([
      "Python · Datos con PySpark",
      "Python · pandas",
    ])
  })

  it("hereda el representante si sólo tiene un quiz fundacional", () => {
    const seccion = seccionConSkills("Python · Fundamentos de datos")
    expect(etiquetasSkillDeSeccion(seccion, representante)).toEqual([representante])
  })

  it("hereda el representante si es lectura pura", () => {
    const seccion = seccionConSkills(null, null)
    expect(etiquetasSkillDeSeccion(seccion, representante)).toEqual([representante])
  })

  it("sin concretas propias y sin representante → vacío", () => {
    const seccion = seccionConSkills("Testing · Fundamentos")
    expect(etiquetasSkillDeSeccion(seccion, null)).toEqual([])
  })
})
