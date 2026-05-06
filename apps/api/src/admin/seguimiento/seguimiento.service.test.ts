// Iter 10 · tests del SeguimientoService (E1/E2/E3) + helpers puros.

import { ConflictException, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { RecalculoService } from "../recalculo/recalculo.service"
import type { AgregadosInscripcion } from "../recalculo/recalculo.types"
import { SeguimientoService, calcularCobertura, calcularSemaforo } from "./seguimiento.service"

const CURSO_ID = "00000000-0000-0000-0000-000000000001"
const INSCRIPCION_1 = "00000000-0000-0000-0000-000000000010"
const INSCRIPCION_2 = "00000000-0000-0000-0000-000000000011"
const PARTICIPANTE_1 = "00000000-0000-0000-0000-000000000020"
const PARTICIPANTE_2 = "00000000-0000-0000-0000-000000000021"
const AREA_A = "00000000-0000-0000-0000-000000000030"
const AREA_B = "00000000-0000-0000-0000-000000000031"
const MODULO_A = "00000000-0000-0000-0000-000000000040"
const MODULO_B = "00000000-0000-0000-0000-000000000041"

type Stub = ReturnType<typeof vi.fn>

interface PrismaStubs {
  curso: { findUnique: Stub }
  inscripcion: { findMany: Stub; findFirst: Stub }
  cursoArea: { findMany: Stub; findFirst: Stub }
  asignacion: { findMany: Stub; findFirst: Stub }
  modulo: { findMany: Stub; findUnique: Stub }
  evaluacionInicial: { findMany: Stub; findUnique: Stub }
  entregaProyecto: { findMany: Stub }
  entregaBloque: { findMany: Stub }
  entrevistaIASesion: { findMany: Stub }
  estadoModuloInscripcion: { findMany: Stub }
}

function buildPrisma(): PrismaStubs {
  return {
    curso: { findUnique: vi.fn() },
    inscripcion: { findMany: vi.fn(), findFirst: vi.fn() },
    cursoArea: { findMany: vi.fn(), findFirst: vi.fn() },
    asignacion: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
    modulo: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn() },
    evaluacionInicial: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn() },
    entregaProyecto: { findMany: vi.fn().mockResolvedValue([]) },
    entregaBloque: { findMany: vi.fn().mockResolvedValue([]) },
    entrevistaIASesion: { findMany: vi.fn().mockResolvedValue([]) },
    estadoModuloInscripcion: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

function buildService(prisma: PrismaStubs = buildPrisma()) {
  const recalculo = new RecalculoService(prisma as unknown as PrismaService)
  // Stub el snapshotAgregadosPorCurso para aislar tests.
  const snapshotPorCurso = vi.fn<(cursoId: string) => Promise<Map<string, AgregadosInscripcion>>>()
  const snapshotIns = vi.fn<(insId: string) => Promise<AgregadosInscripcion>>()
  recalculo.snapshotAgregadosPorCurso =
    snapshotPorCurso as unknown as RecalculoService["snapshotAgregadosPorCurso"]
  recalculo.snapshotAgregados = snapshotIns as unknown as RecalculoService["snapshotAgregados"]
  const service = new SeguimientoService(prisma as unknown as PrismaService, recalculo)
  return { service, prisma, snapshotPorCurso, snapshotIns }
}

function cursoActivoMock(extra: Record<string, unknown> = {}) {
  return {
    id: CURSO_ID,
    estado: "ACTIVO",
    proyectoTransversal: null,
    entrevistaIAConfig: null,
    ...extra,
  }
}

function setupBase(prisma: PrismaStubs) {
  prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
  prisma.inscripcion.findMany.mockResolvedValue([
    {
      id: INSCRIPCION_1,
      estado: "ACTIVA",
      participante: {
        id: PARTICIPANTE_1,
        nombre: "Ana",
        apellido: "Lopez",
        email: "ana@example.com",
      },
    },
    {
      id: INSCRIPCION_2,
      estado: "ACTIVA",
      participante: {
        id: PARTICIPANTE_2,
        nombre: "Bob",
        apellido: "Martinez",
        email: "bob@example.com",
      },
    },
  ])
  prisma.cursoArea.findMany.mockResolvedValue([
    {
      areaId: AREA_A,
      peso: new Prisma.Decimal(60),
      puntajeObjetivo: 70,
      orden: 0,
      area: { id: AREA_A, nombre: "Frontend" },
    },
    {
      areaId: AREA_B,
      peso: new Prisma.Decimal(40),
      puntajeObjetivo: 70,
      orden: 1,
      area: { id: AREA_B, nombre: "Backend" },
    },
  ])
}

// =========================================================================
// helpers puros
// =========================================================================

describe("calcularSemaforo", () => {
  it("verde si nota >= umbral", () => {
    expect(calcularSemaforo(70, 70)).toBe("verde")
    expect(calcularSemaforo(85, 70)).toBe("verde")
  })
  it("amarillo si nota entre umbral-10 y umbral", () => {
    expect(calcularSemaforo(65, 70)).toBe("amarillo")
  })
  it("rojo si nota <= umbral - 10", () => {
    expect(calcularSemaforo(60, 70)).toBe("rojo")
    expect(calcularSemaforo(40, 70)).toBe("rojo")
  })
  it("vacio si nota null", () => {
    expect(calcularSemaforo(null, 70)).toBe("vacio")
  })
})

describe("calcularCobertura", () => {
  it("100% si todas las areas cumplen el umbral", () => {
    const c = calcularCobertura(
      [
        { areaId: AREA_A, peso: 60, umbral: 70 },
        { areaId: AREA_B, peso: 40, umbral: 70 },
      ],
      new Map([
        [AREA_A, 80],
        [AREA_B, 75],
      ]),
    )
    expect(c).toBe(100)
  })
  it("0% si ninguna area cumple", () => {
    const c = calcularCobertura(
      [{ areaId: AREA_A, peso: 100, umbral: 70 }],
      new Map([[AREA_A, 50]]),
    )
    expect(c).toBe(0)
  })
  it("ponderada por peso", () => {
    const c = calcularCobertura(
      [
        { areaId: AREA_A, peso: 60, umbral: 70 },
        { areaId: AREA_B, peso: 40, umbral: 70 },
      ],
      new Map([
        [AREA_A, 80],
        [AREA_B, 50],
      ]),
    )
    expect(c).toBe(60)
  })
})

// =========================================================================
// E1 · matriz
// =========================================================================

describe("SeguimientoService.obtenerMatriz", () => {
  it("E1 actual: arma matriz con notas agregadas y semaforos", async () => {
    const { service, prisma, snapshotPorCurso } = buildService()
    setupBase(prisma)
    snapshotPorCurso.mockResolvedValue(
      new Map([
        [
          INSCRIPCION_1,
          {
            notasModulo: new Map(),
            notasArea: new Map([
              [AREA_A, 80],
              [AREA_B, 75],
            ]),
            notaCurso: 78,
            etiqueta: "APROBADO",
          },
        ],
        [
          INSCRIPCION_2,
          {
            notasModulo: new Map(),
            notasArea: new Map([[AREA_A, 50]]),
            notaCurso: 30,
            etiqueta: "INSUFICIENTE",
          },
        ],
      ]),
    )

    const resp = await service.obtenerMatriz(CURSO_ID, { tab: "actual", estado: "all" })
    expect(resp.cursoId).toBe(CURSO_ID)
    expect(resp.tab).toBe("actual")
    expect(resp.areas).toHaveLength(2)
    expect(resp.filas).toHaveLength(2)
    const fila1 = resp.filas.find((f) => f.inscripcionId === INSCRIPCION_1)
    expect(fila1?.celdas[0]?.semaforo).toBe("verde")
    const fila2 = resp.filas.find((f) => f.inscripcionId === INSCRIPCION_2)
    expect(fila2?.estadoSeguimiento).toBe("EnRiesgo")
  })

  it("E1 inicial: lee EvaluacionInicial.puntaje (no usa recalculo)", async () => {
    const { service, prisma, snapshotPorCurso } = buildService()
    setupBase(prisma)
    prisma.evaluacionInicial.findMany.mockResolvedValue([
      { inscripcionId: INSCRIPCION_1, areaId: AREA_A, puntaje: 80 },
    ])

    const resp = await service.obtenerMatriz(CURSO_ID, { tab: "inicial", estado: "all" })
    expect(snapshotPorCurso).not.toHaveBeenCalled()
    const fila1 = resp.filas.find((f) => f.inscripcionId === INSCRIPCION_1)
    expect(fila1?.celdas[0]?.nota).toBe(80)
    expect(fila1?.celdas[1]?.nota).toBeNull()
  })

  it("E1: filtro por estado=EnRiesgo deja solo esas filas", async () => {
    const { service, prisma, snapshotPorCurso } = buildService()
    setupBase(prisma)
    snapshotPorCurso.mockResolvedValue(
      new Map([
        [
          INSCRIPCION_1,
          {
            notasModulo: new Map(),
            notasArea: new Map([
              [AREA_A, 80],
              [AREA_B, 75],
            ]),
            notaCurso: 78,
            etiqueta: "APROBADO",
          },
        ],
        [
          INSCRIPCION_2,
          {
            notasModulo: new Map(),
            notasArea: new Map(),
            notaCurso: 0,
            etiqueta: "INSUFICIENTE",
          },
        ],
      ]),
    )
    const resp = await service.obtenerMatriz(CURSO_ID, { tab: "actual", estado: "EnRiesgo" })
    expect(resp.filas).toHaveLength(1)
    expect(resp.filas[0]?.inscripcionId).toBe(INSCRIPCION_2)
  })

  it("E1: search filtra por nombre/email (case-insensitive)", async () => {
    const { service, prisma, snapshotPorCurso } = buildService()
    setupBase(prisma)
    snapshotPorCurso.mockResolvedValue(new Map())
    const resp = await service.obtenerMatriz(CURSO_ID, {
      tab: "actual",
      estado: "all",
      search: "BOB",
    })
    expect(resp.filas).toHaveLength(1)
    expect(resp.filas[0]?.participante.email).toBe("bob@example.com")
  })

  it("E1: 404 si curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.obtenerMatriz(CURSO_ID, { tab: "actual", estado: "all" }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("E1: 409 si curso BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({
      ...cursoActivoMock(),
      estado: "BORRADOR",
    })
    await expect(
      service.obtenerMatriz(CURSO_ID, { tab: "actual", estado: "all" }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("E1: 409 si curso > 200 inscripciones", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findMany.mockResolvedValue(
      Array.from({ length: 201 }, (_, i) => ({
        id: `i-${i}`,
        estado: "ACTIVA",
        participante: { id: `p-${i}`, nombre: "x", apellido: "y", email: "z" },
      })),
    )
    prisma.cursoArea.findMany.mockResolvedValue([])
    await expect(
      service.obtenerMatriz(CURSO_ID, { tab: "actual", estado: "all" }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("E1: cobertura ponderada se calcula segun pesos del curso", async () => {
    const { service, prisma, snapshotPorCurso } = buildService()
    setupBase(prisma)
    snapshotPorCurso.mockResolvedValue(
      new Map([
        [
          INSCRIPCION_1,
          {
            notasModulo: new Map(),
            notasArea: new Map([
              [AREA_A, 80],
              [AREA_B, 50],
            ]),
            notaCurso: 60,
            etiqueta: "EN_DESARROLLO",
          },
        ],
      ]),
    )
    const resp = await service.obtenerMatriz(CURSO_ID, { tab: "actual", estado: "all" })
    const fila1 = resp.filas.find((f) => f.inscripcionId === INSCRIPCION_1)
    // pesoA=60, pesoB=40. Cumple solo A → 60/100*100 = 60.
    expect(fila1?.cobertura).toBe(60)
  })
})

// =========================================================================
// E2 · KPIs
// =========================================================================

describe("SeguimientoService.obtenerKpis", () => {
  it("E2 actual: cumplimientoPct + enRiesgo + completados", async () => {
    const { service, prisma, snapshotPorCurso } = buildService()
    setupBase(prisma)
    snapshotPorCurso.mockResolvedValue(
      new Map([
        [
          INSCRIPCION_1,
          {
            notasModulo: new Map(),
            notasArea: new Map([
              [AREA_A, 80],
              [AREA_B, 75],
            ]),
            notaCurso: 78,
            etiqueta: "APROBADO",
          },
        ],
        [
          INSCRIPCION_2,
          {
            notasModulo: new Map(),
            notasArea: new Map(),
            notaCurso: null,
            etiqueta: "INSUFICIENTE",
          },
        ],
      ]),
    )
    const resp = await service.obtenerKpis(CURSO_ID, "actual")
    expect(resp.tab).toBe("actual")
    if (resp.tab === "actual") {
      // Sin OBLIGATORIOs → no es Apto. Filas: ins1 EnRuta, ins2 EnRiesgo.
      expect(resp.cumplimientoPct).toBe(0)
      expect(resp.enRiesgo).toBe(1)
      expect(resp.completados).toBe(0)
    }
  })

  it("E2 inicial: diagnosticados / sinDiagnostico / areasConBrecha / promedio", async () => {
    const { service, prisma } = buildService()
    setupBase(prisma)
    prisma.evaluacionInicial.findMany.mockResolvedValue([
      { inscripcionId: INSCRIPCION_1, areaId: AREA_A, puntaje: 50 }, // brecha A
      { inscripcionId: INSCRIPCION_1, areaId: AREA_B, puntaje: 80 },
    ])
    prisma.inscripcion.findMany.mockImplementation((args: { where?: { tipo?: string } }) => {
      if (args?.where?.tipo === "SOLICITUD") {
        return Promise.resolve([{ id: INSCRIPCION_1 }, { id: INSCRIPCION_2 }])
      }
      return Promise.resolve([
        {
          id: INSCRIPCION_1,
          estado: "ACTIVA",
          participante: {
            id: PARTICIPANTE_1,
            nombre: "Ana",
            apellido: "Lopez",
            email: "ana@example.com",
          },
        },
        {
          id: INSCRIPCION_2,
          estado: "ACTIVA",
          participante: {
            id: PARTICIPANTE_2,
            nombre: "Bob",
            apellido: "Martinez",
            email: "bob@example.com",
          },
        },
      ])
    })

    const resp = await service.obtenerKpis(CURSO_ID, "inicial")
    expect(resp.tab).toBe("inicial")
    if (resp.tab === "inicial") {
      expect(resp.diagnosticados).toBe(1)
      // Solo INSCRIPCION_2 esta SOLICITUD sin EvaluacionInicial.
      expect(resp.sinDiagnostico).toBe(1)
      expect(resp.areasConBrecha).toBe(1) // solo AREA_A
    }
  })
})

// =========================================================================
// E3 · celda
// =========================================================================

describe("SeguimientoService.obtenerCelda", () => {
  it("E3 inicial: devuelve nota + observaciones + capturadaAt", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_1 })
    prisma.cursoArea.findFirst.mockResolvedValue({ areaId: AREA_A, puntajeObjetivo: 70 })
    prisma.evaluacionInicial.findUnique.mockResolvedValue({
      puntaje: 65,
      observaciones: "buena base",
      capturadaAt: new Date("2026-01-01T00:00:00Z"),
      capturadaPor: { id: "u1", nombre: "Admin", apellido: "Test" },
    })
    prisma.asignacion.findFirst.mockResolvedValue(null)

    const resp = await service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "inicial")
    expect(resp.tab).toBe("inicial")
    if (resp.tab === "inicial") {
      expect(resp.nota).toBe(65)
      expect(resp.observaciones).toBe("buena base")
      expect(resp.asignacionConfirmada).toBeNull()
    }
  })

  it("E3: 404 si la inscripcion no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue(null)
    await expect(
      service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "actual"),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("E3: 404 si el area no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_1 })
    prisma.cursoArea.findFirst.mockResolvedValue(null)
    await expect(
      service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "inicial"),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("E3 inicial: asignacionConfirmada se resuelve por modulo.areaId, no por orden", async () => {
    // Repro del bug: el inscripto tiene 2 asignaciones (una en AREA_A
    // OBLIGATORIO, otra en AREA_B RECOMENDADO). Pidiendo la celda de AREA_B
    // debe responder RECOMENDADO sin importar cual asignacion venga primero.
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_1 })
    prisma.cursoArea.findFirst.mockResolvedValue({ areaId: AREA_B, puntajeObjetivo: 70 })
    prisma.evaluacionInicial.findUnique.mockResolvedValue(null)
    // modulo.findMany filtrado por areaId=AREA_B → solo MODULO_B.
    prisma.modulo.findMany.mockImplementation(
      (args: { where?: { areaId?: string } }): Promise<Array<{ id: string }>> => {
        if (args?.where?.areaId === AREA_B) {
          return Promise.resolve([{ id: MODULO_B }])
        }
        if (args?.where?.areaId === AREA_A) {
          return Promise.resolve([{ id: MODULO_A }])
        }
        return Promise.resolve([])
      },
    )
    // asignacion.findFirst recibe { inscripcionId, moduloId: { in: [...] } }.
    // Devolvemos segun el IN: si pide MODULO_B → RECOMENDADO; MODULO_A → OBLIGATORIO.
    prisma.asignacion.findFirst.mockImplementation(
      (args: {
        where?: { moduloId?: { in?: string[] } }
      }): Promise<{ tipo: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL" } | null> => {
        const ids = args?.where?.moduloId?.in ?? []
        if (ids.includes(MODULO_B)) {
          return Promise.resolve({ tipo: "RECOMENDADO" })
        }
        if (ids.includes(MODULO_A)) {
          return Promise.resolve({ tipo: "OBLIGATORIO" })
        }
        return Promise.resolve(null)
      },
    )

    const respB = await service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_B, "inicial")
    expect(respB.tab).toBe("inicial")
    if (respB.tab === "inicial") {
      expect(respB.asignacionConfirmada).toBe("RECOMENDADO")
    }

    const respA = await service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "inicial")
    if (respA.tab === "inicial") {
      expect(respA.asignacionConfirmada).toBe("OBLIGATORIO")
    }
  })

  it("E3 inicial: asignacionConfirmada=null si el area no tiene modulos asignados al inscripto", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_1 })
    prisma.cursoArea.findFirst.mockResolvedValue({ areaId: AREA_A, puntajeObjetivo: 70 })
    prisma.evaluacionInicial.findUnique.mockResolvedValue(null)
    // El area existe en el curso pero el inscripto no tiene asignacion en ella.
    prisma.modulo.findMany.mockResolvedValue([{ id: MODULO_A }])
    prisma.asignacion.findFirst.mockResolvedValue(null)

    const resp = await service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "inicial")
    if (resp.tab === "inicial") {
      expect(resp.asignacionConfirmada).toBeNull()
    }
  })

  it("E3 inicial: asignacionConfirmada=null si el area no tiene modulos en el curso (modulosDelArea vacio)", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_1 })
    prisma.cursoArea.findFirst.mockResolvedValue({ areaId: AREA_A, puntajeObjetivo: 70 })
    prisma.evaluacionInicial.findUnique.mockResolvedValue(null)
    prisma.modulo.findMany.mockResolvedValue([])

    const resp = await service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "inicial")
    if (resp.tab === "inicial") {
      expect(resp.asignacionConfirmada).toBeNull()
    }
    // Optimizacion: cuando no hay modulos del area, NO se debe consultar asignacion.
    expect(prisma.asignacion.findFirst).not.toHaveBeenCalled()
  })

  it("E3 actual: arma modulosArea + entregasRecientes + alertas", async () => {
    const { service, prisma, snapshotIns } = buildService()
    prisma.curso.findUnique.mockResolvedValue(cursoActivoMock())
    prisma.inscripcion.findFirst.mockResolvedValue({ id: INSCRIPCION_1 })
    prisma.cursoArea.findFirst.mockResolvedValue({ areaId: AREA_A, puntajeObjetivo: 70 })
    snapshotIns.mockResolvedValue({
      notasModulo: new Map([[MODULO_A, 80]]),
      notasArea: new Map([[AREA_A, 80]]),
      notaCurso: 80,
      etiqueta: "APROBADO",
    })
    prisma.modulo.findMany.mockResolvedValue([{ id: MODULO_A, titulo: "Mod A" }])
    prisma.estadoModuloInscripcion.findMany.mockResolvedValue([
      { moduloId: MODULO_A, estado: "EN_PROGRESO" },
    ])
    prisma.entregaBloque.findMany.mockResolvedValue([
      {
        id: "e1",
        bloqueId: "b1",
        nota: new Prisma.Decimal(80),
        estado: "EVALUADA",
        enviadaAt: new Date(),
      },
    ])

    const resp = await service.obtenerCelda(CURSO_ID, INSCRIPCION_1, AREA_A, "actual")
    expect(resp.tab).toBe("actual")
    if (resp.tab === "actual") {
      expect(resp.notaArea).toBe(80)
      expect(resp.modulosArea).toHaveLength(1)
      expect(resp.modulosArea[0]?.estado).toBe("EN_PROGRESO")
      expect(resp.entregasRecientes).toHaveLength(1)
      expect(resp.alertas).toEqual([])
    }
  })
})
