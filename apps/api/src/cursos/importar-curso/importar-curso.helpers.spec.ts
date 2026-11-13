import type {
  ImportarCursoInput,
  ModuloImportado,
  SeccionImportada,
} from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"

import {
  completarSkillsFaltantes,
  esSkillFundamentos,
  etiquetasSkillDeSeccion,
  normalizarNombreCliente,
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

describe("completarSkillsFaltantes", () => {
  function curso(...modulos: ModuloImportado[]): ImportarCursoInput {
    return {
      curso: {
        titulo: "Data Engineer - AWS",
        cliente: "c",
        fechaInicio: "2026-01-01",
        fechaDeadline: "2026-12-31",
      },
      modulos,
    } as ImportarCursoInput
  }

  function moduloTitulado(titulo: string, ...secciones: SeccionImportada[]): ModuloImportado {
    return { titulo, descripcion: "", secciones } as ModuloImportado
  }

  function seccionConEvaluableSinSkill(): SeccionImportada {
    return {
      titulo: "s",
      bloques: [
        { tipo: "PARRAFO", contenido: { html: "", textoPlano: "", tiempoLecturaMin: 1 } },
        { tipo: "QUIZ", contenido: {} },
      ],
    } as SeccionImportada
  }

  it("da a cada evaluable sin skill la skill «curso · módulo»", () => {
    const resultado = completarSkillsFaltantes(
      curso(moduloTitulado("Semana 1 · S3", seccionConEvaluableSinSkill())),
    )
    const bloques = resultado.modulos[0]?.secciones[0]?.bloques ?? []
    expect(bloques[1]).toMatchObject({ skillEtiqueta: "Data Engineer - AWS · Semana 1 · S3" })
    expect(bloques[0]).not.toHaveProperty("skillEtiqueta")
  })

  it("respeta la skill declarada", () => {
    const resultado = completarSkillsFaltantes(
      curso(moduloTitulado("m", seccionConSkills("AWS · Glue"))),
    )
    expect(resultado.modulos[0]?.secciones[0]?.bloques[0]).toMatchObject({
      skillEtiqueta: "AWS · Glue",
    })
  })

  it("el módulo resultante tiene representante y sus secciones de lectura lo heredan", () => {
    const lectura = seccionConSkills(null)
    const resultado = completarSkillsFaltantes(
      curso(moduloTitulado("Semana 2", lectura, seccionConEvaluableSinSkill())),
    )
    const mod = resultado.modulos[0] as ModuloImportado
    const representante = representanteDeModulo(mod)
    expect(representante).toBe("Data Engineer - AWS · Semana 2")
    expect(etiquetasSkillDeSeccion(mod.secciones[0] as SeccionImportada, representante)).toEqual([
      "Data Engineer - AWS · Semana 2",
    ])
  })

  it("recorta la etiqueta a 200 caracteres", () => {
    const resultado = completarSkillsFaltantes(
      curso(moduloTitulado("x".repeat(250), seccionConEvaluableSinSkill())),
    )
    const bloque = resultado.modulos[0]?.secciones[0]?.bloques[1] as { skillEtiqueta: string }
    expect(bloque.skillEtiqueta.length).toBe(200)
  })
})

describe("normalizarNombreCliente", () => {
  it("ignora mayúsculas, tildes, espacios repetidos y el tipo de guion", () => {
    expect(normalizarNombreCliente("  NTT Data — Frontend   Práctice ")).toBe(
      normalizarNombreCliente("ntt data - frontend practice"),
    )
  })

  it("distingue nombres realmente distintos", () => {
    expect(normalizarNombreCliente("NTTDATA - Application Services")).not.toBe(
      normalizarNombreCliente("NTT Data - Application Services"),
    )
  })
})
