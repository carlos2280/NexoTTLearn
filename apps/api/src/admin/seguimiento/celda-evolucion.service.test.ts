// Iter 10 · PR 3a · tests de CeldaEvolucionService + lib.

import { NotFoundException } from "@nestjs/common"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { calcularProyeccion, regresionLineal } from "./celda-evolucion.lib"
import { CeldaEvolucionService } from "./celda-evolucion.service"

const CURSO_ID = "00000000-0000-0000-0000-000000000001"
const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000010"
const AREA_ID = "00000000-0000-0000-0000-000000000030"

type Stub = ReturnType<typeof vi.fn>
interface PrismaStubs {
  inscripcion: { findFirst: Stub }
  cursoArea: { findFirst: Stub }
  evaluacionInicial: { findUnique: Stub }
  entregaBloque: { findMany: Stub }
}

function buildPrisma(): PrismaStubs {
  return {
    inscripcion: { findFirst: vi.fn() },
    cursoArea: { findFirst: vi.fn() },
    evaluacionInicial: { findUnique: vi.fn() },
    entregaBloque: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

function buildService(p: PrismaStubs): CeldaEvolucionService {
  return new CeldaEvolucionService(p as unknown as PrismaService)
}

describe("regresionLineal", () => {
  it("devuelve null con menos de 2 puntos", () => {
    expect(regresionLineal([])).toBeNull()
    expect(regresionLineal([{ x: 0, y: 50 }])).toBeNull()
  })

  it("calcula pendiente positiva sobre serie creciente", () => {
    const reg = regresionLineal([
      { x: 0, y: 40 },
      { x: 10, y: 60 },
      { x: 20, y: 80 },
    ])
    expect(reg).not.toBeNull()
    expect(reg?.pendiente).toBeCloseTo(2, 5)
    expect(reg?.intercepto).toBeCloseTo(40, 5)
  })

  it("usa solo los últimos 5 puntos", () => {
    const reg = regresionLineal([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 10, y: 50 },
      { x: 20, y: 60 },
      { x: 30, y: 70 },
      { x: 40, y: 80 },
      { x: 50, y: 90 },
    ])
    // Los últimos 5: pendiente debería ser cercana a 1.
    expect(reg?.pendiente).toBeCloseTo(1, 5)
  })

  it("devuelve null si todos los puntos están en el mismo x", () => {
    const reg = regresionLineal([
      { x: 5, y: 30 },
      { x: 5, y: 60 },
    ])
    expect(reg).toBeNull()
  })
})

describe("calcularProyeccion", () => {
  it("pendiente <= 0 → ambos null", () => {
    const r = calcularProyeccion({
      puntos: [
        { x: 0, y: 80 },
        { x: 10, y: 60 },
      ],
      umbralArea: 70,
      xHoy: 10,
    })
    expect(r).toEqual({ diasAlObjetivo: null, valorEstimado: null })
  })

  it("calcula días al objetivo con pendiente positiva", () => {
    const r = calcularProyeccion({
      puntos: [
        { x: 0, y: 40 },
        { x: 10, y: 50 },
      ],
      umbralArea: 70,
      xHoy: 10,
    })
    expect(r.diasAlObjetivo).toBe(20)
    expect(r.valorEstimado).toBeCloseTo(80, 5)
  })

  it("ya supera el umbral hoy → diasAlObjetivo = 0", () => {
    const r = calcularProyeccion({
      puntos: [
        { x: 0, y: 60 },
        { x: 10, y: 80 },
      ],
      umbralArea: 70,
      xHoy: 10,
    })
    expect(r.diasAlObjetivo).toBe(0)
  })

  it("cap valorEstimado a 100", () => {
    const r = calcularProyeccion({
      puntos: [
        { x: 0, y: 80 },
        { x: 1, y: 95 },
      ],
      umbralArea: 70,
      xHoy: 1,
    })
    expect(r.valorEstimado).toBe(100)
  })
})

describe("CeldaEvolucionService.obtener", () => {
  it("404 cuando no existe inscripción del curso", async () => {
    const p = buildPrisma()
    p.inscripcion.findFirst.mockResolvedValue(null)
    await expect(buildService(p).obtener(CURSO_ID, INSCRIPCION_ID, AREA_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("404 cuando el área no pertenece al curso", async () => {
    const p = buildPrisma()
    p.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_ID })
    p.cursoArea.findFirst.mockResolvedValue(null)
    await expect(buildService(p).obtener(CURSO_ID, INSCRIPCION_ID, AREA_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("happy path: inicial + entregas, proyección con pendiente positiva", async () => {
    const p = buildPrisma()
    p.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_ID })
    p.cursoArea.findFirst.mockResolvedValue({ puntajeObjetivo: 70 })
    p.evaluacionInicial.findUnique.mockResolvedValue({
      puntaje: 40,
      capturadaAt: new Date("2026-01-01T00:00:00Z"),
    })
    p.entregaBloque.findMany.mockResolvedValue([
      {
        nota: 55,
        enviadaAt: new Date("2026-01-11T00:00:00Z"),
        bloque: { seccion: { titulo: "Bloque 1" } },
      },
      {
        nota: 65,
        enviadaAt: new Date("2026-01-21T00:00:00Z"),
        bloque: { seccion: { titulo: "Bloque 2" } },
      },
    ])

    const r = await buildService(p).obtener(CURSO_ID, INSCRIPCION_ID, AREA_ID)
    expect(r.puntos).toHaveLength(3)
    expect(r.puntos[0]?.hito).toBe("Diagnóstico inicial")
    expect(r.puntos[0]?.valor).toBe(40)
    expect(r.puntos[2]?.hito).toBe("Bloque 2")
    expect(r.proyeccion.diasAlObjetivo).not.toBeNull()
    expect(r.proyeccion.valorEstimado).not.toBeNull()
  })

  it("sin evaluación inicial: arranca desde primera entrega", async () => {
    const p = buildPrisma()
    p.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_ID })
    p.cursoArea.findFirst.mockResolvedValue({ puntajeObjetivo: 70 })
    p.evaluacionInicial.findUnique.mockResolvedValue(null)
    p.entregaBloque.findMany.mockResolvedValue([
      {
        nota: 50,
        enviadaAt: new Date("2026-02-01T00:00:00Z"),
        bloque: { seccion: { titulo: "B1" } },
      },
      {
        nota: 60,
        enviadaAt: new Date("2026-02-11T00:00:00Z"),
        bloque: { seccion: { titulo: "B2" } },
      },
    ])
    const r = await buildService(p).obtener(CURSO_ID, INSCRIPCION_ID, AREA_ID)
    expect(r.puntos).toHaveLength(2)
    expect(r.puntos[0]?.hito).toBe("B1")
  })

  it("menos de 2 puntos → proyección null", async () => {
    const p = buildPrisma()
    p.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_ID })
    p.cursoArea.findFirst.mockResolvedValue({ puntajeObjetivo: 70 })
    p.evaluacionInicial.findUnique.mockResolvedValue({
      puntaje: 50,
      capturadaAt: new Date("2026-01-01T00:00:00Z"),
    })
    p.entregaBloque.findMany.mockResolvedValue([])
    const r = await buildService(p).obtener(CURSO_ID, INSCRIPCION_ID, AREA_ID)
    expect(r.puntos).toHaveLength(1)
    expect(r.proyeccion).toEqual({ diasAlObjetivo: null, valorEstimado: null })
  })

  it("pendiente <= 0 → proyección null aunque haya muchos puntos", async () => {
    const p = buildPrisma()
    p.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_ID })
    p.cursoArea.findFirst.mockResolvedValue({ puntajeObjetivo: 70 })
    p.evaluacionInicial.findUnique.mockResolvedValue({
      puntaje: 80,
      capturadaAt: new Date("2026-01-01T00:00:00Z"),
    })
    p.entregaBloque.findMany.mockResolvedValue([
      {
        nota: 70,
        enviadaAt: new Date("2026-01-11T00:00:00Z"),
        bloque: { seccion: { titulo: "B1" } },
      },
      {
        nota: 60,
        enviadaAt: new Date("2026-01-21T00:00:00Z"),
        bloque: { seccion: { titulo: "B2" } },
      },
    ])
    const r = await buildService(p).obtener(CURSO_ID, INSCRIPCION_ID, AREA_ID)
    expect(r.proyeccion.diasAlObjetivo).toBeNull()
    expect(r.proyeccion.valorEstimado).toBeNull()
  })
})
