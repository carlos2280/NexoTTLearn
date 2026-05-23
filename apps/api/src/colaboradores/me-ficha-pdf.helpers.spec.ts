import type { EventoHistorialFicha, FichaResponse } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  construirFraseNarrativa,
  esHitoMayor,
  fichaAPdfReporte,
  filtrarHitosMayores,
  fortalezaActual,
} from "./me-ficha-pdf.helpers"

const FICHA: FichaResponse = {
  colaboradorId: "11111111-1111-1111-1111-111111111111",
  skills: [],
  porArea: [
    {
      areaId: "a1",
      nombre: "Frontend",
      promedio: 78,
      skillsConNota: 7,
      skillsTotales: 10,
      nivelCualitativo: "solido",
      skillsCatalogo: [],
    },
    {
      areaId: "a2",
      nombre: "DevOps Azure",
      promedio: 92,
      skillsConNota: 1,
      skillsTotales: 1,
      nivelCualitativo: "excelencia",
      skillsCatalogo: [],
    },
    {
      areaId: "a3",
      nombre: "Backend",
      promedio: null,
      skillsConNota: 0,
      skillsTotales: 1,
      nivelCualitativo: "sinTocar",
      skillsCatalogo: [],
    },
  ],
}

const HITOS: readonly EventoHistorialFicha[] = [
  {
    tipo: "CURSO_COMPLETADO",
    id: "e1",
    fecha: "2026-05-18T10:00:00.000Z",
    cursoId: "c1",
    cursoTitulo: "Frontend para devs backend",
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "e2",
    fecha: "2026-05-15T10:00:00.000Z",
    skillId: "s1",
    skillNombre: "Testing frontend",
    areaId: "a1",
    areaNombre: "Frontend",
    nivelCualitativo: "solido",
    origenNarrativo: "Demostrada en el proyecto transversal",
    origen: "TRANSVERSAL",
  },
  {
    tipo: "CURSO_INICIADO",
    id: "e3",
    fecha: "2026-04-01T10:00:00.000Z",
    cursoId: "c1",
    cursoTitulo: "Frontend para devs backend",
  },
]

describe("me-ficha-pdf helpers", () => {
  it("fortalezaActual devuelve el area con mayor promedio entre las activas", () => {
    expect(fortalezaActual(FICHA.porArea)).toBe("DevOps Azure")
  })

  it("fortalezaActual devuelve null cuando no hay actividad", () => {
    const vacio: FichaResponse["porArea"] = FICHA.porArea.filter((a) => a.skillsConNota === 0)
    expect(fortalezaActual(vacio)).toBeNull()
  })

  it("construirFraseNarrativa elige frase segun nivel del camino", () => {
    expect(construirFraseNarrativa(FICHA.porArea)).toBe("Esta dando los primeros pasos.")
    expect(construirFraseNarrativa([])).toBe("Su camino comienza aqui.")
  })

  it("esHitoMayor marca completar curso y skills via transversal o IA", () => {
    expect(esHitoMayor(HITOS[0] as EventoHistorialFicha)).toBe(true)
    expect(esHitoMayor(HITOS[1] as EventoHistorialFicha)).toBe(true)
    expect(esHitoMayor(HITOS[2] as EventoHistorialFicha)).toBe(false)
  })

  it("filtrarHitosMayores excluye eventos menores como CURSO_INICIADO", () => {
    const mayores = filtrarHitosMayores(HITOS)
    expect(mayores).toHaveLength(2)
    expect(mayores.every((h) => h.tipo !== "CURSO_INICIADO")).toBe(true)
  })

  it("fichaAPdfReporte devuelve Buffer no vacio empezando por magic %PDF", async () => {
    const buffer = await fichaAPdfReporte({
      ficha: FICHA,
      identidad: { nombre: "Valentina Araya" },
      hitos: filtrarHitosMayores(HITOS),
      fechaGeneracion: new Date("2026-05-22T12:00:00.000Z"),
    })
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.byteLength).toBeGreaterThan(1000)
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF")
  })

  it("fichaAPdfReporte se genera sin error con ficha vacia y sin hitos", async () => {
    const fichaVacia: FichaResponse = { ...FICHA, porArea: [] }
    const buffer = await fichaAPdfReporte({
      ficha: fichaVacia,
      identidad: { nombre: "Test User" },
      hitos: [],
    })
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF")
  })
})
