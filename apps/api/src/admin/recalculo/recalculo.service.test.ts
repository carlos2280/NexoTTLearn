// Iter 9.9 · tests del RecalculoService
//
// Cobertura:
// - Cadena bloque (modulo → area → curso → etiqueta)
// - Cadena mini (idem)
// - Cadena transversal (curso → etiqueta)
// - Idempotencia A26 caso borde 1 (sin cambio agregado → 0 logs)
// - Comparacion pre/post (snapshotAgregados + diff)
// - causaId (encadenado al log padre)
// - Tipos de logs (RECALCULO_MODULO/AREA/CURSO/ETIQUETA)
// - Rollback en error (cliente tx propaga error)

import { NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import { derivarEtiquetaLogro, promedioPonderado } from "../../common/calculo-nota"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { RecalculoService } from "./recalculo.service"
import type { AgregadosInscripcion } from "./recalculo.types"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  inscripcion: { findUnique: Stub }
  entregaBloque: { findMany: Stub }
  entregaProyecto: { findMany: Stub }
  logActividad: { create: Stub }
}

function buildPrisma(): PrismaMock {
  return {
    inscripcion: { findUnique: vi.fn() },
    entregaBloque: { findMany: vi.fn() },
    entregaProyecto: { findMany: vi.fn() },
    logActividad: { create: vi.fn().mockResolvedValue({ id: "log-recalc" }) },
  }
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  const service = new RecalculoService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const AREA_A_ID = "00000000-0000-0000-0000-000000000010"
const AREA_B_ID = "00000000-0000-0000-0000-000000000011"
const MODULO_A_ID = "00000000-0000-0000-0000-000000000020"
const MODULO_B_ID = "00000000-0000-0000-0000-000000000021"
const SECCION_A_ID = "00000000-0000-0000-0000-000000000030"
const BLOQUE_1_ID = "00000000-0000-0000-0000-000000000040"
const BLOQUE_2_ID = "00000000-0000-0000-0000-000000000041"
const ACTOR_ID = "00000000-0000-0000-0000-000000000099"

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n)
}

interface CursoMock {
  pesoAreas?: number
  pesoProyectoTransversal?: number
  pesoEntrevistaIA?: number
  pesoActividades?: number
  pesoMiniProyecto?: number
  umbralExcelencia?: number
  umbralAprobado?: number
  umbralEnDesarrollo?: number
  cursoAreas?: Array<{ areaId: string; peso: number }>
  modulos?: Array<{
    id: string
    areaId: string
    miniProyectoActivo: boolean
    secciones: Array<{ id: string; bloques: Array<{ id: string }> }>
  }>
}

function buildInscripcionMock(curso: CursoMock = {}) {
  return {
    id: INSCRIPCION_ID,
    curso: {
      id: CURSO_ID,
      pesoAreas: dec(curso.pesoAreas ?? 70),
      pesoProyectoTransversal: dec(curso.pesoProyectoTransversal ?? 20),
      pesoEntrevistaIA: dec(curso.pesoEntrevistaIA ?? 10),
      pesoActividades: dec(curso.pesoActividades ?? 70),
      pesoMiniProyecto: dec(curso.pesoMiniProyecto ?? 30),
      umbralExcelencia: curso.umbralExcelencia ?? 90,
      umbralAprobado: curso.umbralAprobado ?? 70,
      umbralEnDesarrollo: curso.umbralEnDesarrollo ?? 50,
      cursoAreas: (curso.cursoAreas ?? [{ areaId: AREA_A_ID, peso: 100 }]).map((ca) => ({
        areaId: ca.areaId,
        peso: dec(ca.peso),
      })),
      modulos: curso.modulos ?? [
        {
          id: MODULO_A_ID,
          areaId: AREA_A_ID,
          miniProyectoActivo: false,
          secciones: [
            {
              id: SECCION_A_ID,
              bloques: [{ id: BLOQUE_1_ID }, { id: BLOQUE_2_ID }],
            },
          ],
        },
      ],
    },
  }
}

// =============================================================================
// HELPERS PUROS (calculo-nota)
// =============================================================================

describe("calculo-nota helpers", () => {
  it("promedioPonderado vacio devuelve null", () => {
    expect(promedioPonderado([])).toBeNull()
  })

  it("promedioPonderado con pesos cero devuelve null", () => {
    expect(promedioPonderado([{ valor: 80, peso: 0 }])).toBeNull()
  })

  it("promedioPonderado con pesos uniformes = promedio simple", () => {
    expect(
      promedioPonderado([
        { valor: 80, peso: 1 },
        { valor: 60, peso: 1 },
      ]),
    ).toBe(70)
  })

  it("promedioPonderado redondea HALF_UP a 2 decimales", () => {
    // 33.335 → 33.34 (HALF_UP)
    expect(
      promedioPonderado([
        { valor: 33.33, peso: 1 },
        { valor: 33.34, peso: 1 },
      ]),
    ).toBe(33.34)
  })

  it("derivarEtiquetaLogro nota null → null", () => {
    expect(
      derivarEtiquetaLogro(null, {
        umbralExcelencia: 90,
        umbralAprobado: 70,
        umbralEnDesarrollo: 50,
      }),
    ).toBeNull()
  })

  it("derivarEtiquetaLogro 95 → EXCELENCIA", () => {
    expect(
      derivarEtiquetaLogro(95, {
        umbralExcelencia: 90,
        umbralAprobado: 70,
        umbralEnDesarrollo: 50,
      }),
    ).toBe("EXCELENCIA")
  })

  it("derivarEtiquetaLogro 70 → APROBADO (>=)", () => {
    expect(
      derivarEtiquetaLogro(70, {
        umbralExcelencia: 90,
        umbralAprobado: 70,
        umbralEnDesarrollo: 50,
      }),
    ).toBe("APROBADO")
  })

  it("derivarEtiquetaLogro 49.99 → INSUFICIENTE", () => {
    expect(
      derivarEtiquetaLogro(49.99, {
        umbralExcelencia: 90,
        umbralAprobado: 70,
        umbralEnDesarrollo: 50,
      }),
    ).toBe("INSUFICIENTE")
  })
})

// =============================================================================
// snapshotAgregados — lectura de estado actual
// =============================================================================

describe("snapshotAgregados", () => {
  it("inscripcion sin entregas → todos null/empty", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    expect(ag.notasModulo.size).toBe(0)
    expect(ag.notasArea.size).toBe(0)
    expect(ag.notaCurso).toBeNull()
    expect(ag.etiqueta).toBeNull()
  })

  it("entrega de bloque produce nota modulo + area + curso + etiqueta", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(80) },
      { bloqueId: BLOQUE_2_ID, nota: dec(60) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    // promedio bloques = 70; sin mini, peso actividades 70 → notaModulo = 70
    expect(ag.notasModulo.get(MODULO_A_ID)).toBe(70)
    // 1 modulo en area → nota area = 70
    expect(ag.notasArea.get(AREA_A_ID)).toBe(70)
    // pesoAreas 70, sin transversal → notaCurso = 70
    expect(ag.notaCurso).toBe(70)
    expect(ag.etiqueta).toBe("APROBADO")
  })

  it("mejor intento por bloque cuenta el max", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(40) },
      { bloqueId: BLOQUE_1_ID, nota: dec(90) },
      { bloqueId: BLOQUE_2_ID, nota: dec(80) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    // mejor de bloque1 = 90, bloque2 = 80 → modulo = 85
    expect(ag.notasModulo.get(MODULO_A_ID)).toBe(85)
  })

  it("mini proyecto pondera con actividades segun pesos del curso", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(
      buildInscripcionMock({
        modulos: [
          {
            id: MODULO_A_ID,
            areaId: AREA_A_ID,
            miniProyectoActivo: true,
            secciones: [{ id: SECCION_A_ID, bloques: [{ id: BLOQUE_1_ID }] }],
          },
        ],
      }),
    )
    prisma.entregaBloque.findMany.mockResolvedValue([{ bloqueId: BLOQUE_1_ID, nota: dec(60) }])
    prisma.entregaProyecto.findMany.mockResolvedValue([
      {
        miniProyectoId: "mini-1",
        transversalId: null,
        notaFinal: dec(100),
        intento: 1,
        miniProyecto: { moduloId: MODULO_A_ID },
      },
    ])
    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    // actividades 60 * 70 + mini 100 * 30 = 4200 + 3000 = 7200; / 100 = 72
    expect(ag.notasModulo.get(MODULO_A_ID)).toBe(72)
  })

  it("transversal contribuye a notaCurso (cadena curso → etiqueta)", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(
      buildInscripcionMock({ pesoAreas: 70, pesoProyectoTransversal: 30, pesoEntrevistaIA: 0 }),
    )
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(70) },
      { bloqueId: BLOQUE_2_ID, nota: dec(70) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([
      {
        miniProyectoId: null,
        transversalId: "tr-1",
        notaFinal: dec(100),
        intento: 1,
        miniProyecto: null,
      },
    ])
    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    // areas global = 70; (70*70 + 100*30)/100 = 79
    expect(ag.notaCurso).toBe(79)
    expect(ag.etiqueta).toBe("APROBADO")
  })

  it("dos areas con dos modulos cada una agrega correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(
      buildInscripcionMock({
        cursoAreas: [
          { areaId: AREA_A_ID, peso: 60 },
          { areaId: AREA_B_ID, peso: 40 },
        ],
        modulos: [
          {
            id: MODULO_A_ID,
            areaId: AREA_A_ID,
            miniProyectoActivo: false,
            secciones: [{ id: SECCION_A_ID, bloques: [{ id: BLOQUE_1_ID }] }],
          },
          {
            id: MODULO_B_ID,
            areaId: AREA_B_ID,
            miniProyectoActivo: false,
            secciones: [{ id: "sec-b", bloques: [{ id: BLOQUE_2_ID }] }],
          },
        ],
      }),
    )
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(80) },
      { bloqueId: BLOQUE_2_ID, nota: dec(60) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    expect(ag.notasArea.get(AREA_A_ID)).toBe(80)
    expect(ag.notasArea.get(AREA_B_ID)).toBe(60)
    // (80*60 + 60*40)/100 = 72
    expect(ag.notaCurso).toBe(72)
  })

  it("inscripcion no encontrada → vacios (no lanza)", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const ag = await service.snapshotAgregados(INSCRIPCION_ID)
    expect(ag.notaCurso).toBeNull()
  })
})

// =============================================================================
// recalcularInscripcionCompleta — diff + emision de logs
// =============================================================================

describe("recalcularInscripcionCompleta", () => {
  it("lanza 404 si la inscripcion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)
    await expect(service.recalcularInscripcionCompleta(INSCRIPCION_ID, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("idempotencia: agregadosAntes === despues → 0 logs (A26 caso borde 1)", async () => {
    const { service, prisma } = buildService()
    // findUnique se llama dos veces: 1) check existe, 2) calcularAgregados
    const inscripcionRow = buildInscripcionMock()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(inscripcionRow)
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(80) },
      { bloqueId: BLOQUE_2_ID, nota: dec(60) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    // Pasa "antes" identico al "despues" calculado.
    const agregadosAntes: AgregadosInscripcion = {
      notasModulo: new Map([[MODULO_A_ID, 70]]),
      notasArea: new Map([[AREA_A_ID, 70]]),
      notaCurso: 70,
      etiqueta: "APROBADO",
    }
    const result = await service.recalcularInscripcionCompleta(INSCRIPCION_ID, ACTOR_ID, {
      agregadosAntes,
    })
    expect(result.diff.sinCambios).toBe(true)
    expect(result.logsEmitidos).toBe(0)
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })

  it("primera evaluacion (antes vacios, despues con datos) emite logs", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(95) },
      { bloqueId: BLOQUE_2_ID, nota: dec(95) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const result = await service.recalcularInscripcionCompleta(INSCRIPCION_ID, ACTOR_ID)
    expect(result.diff.sinCambios).toBe(false)
    // 1 modulo + 1 area + 1 curso + 1 etiqueta = 4
    expect(result.logsEmitidos).toBe(4)
    const accionesLog = prisma.logActividad.create.mock.calls.map(
      (c: unknown[]) => (c[0] as { data: { tipoAccion: string } }).data.tipoAccion,
    )
    expect(accionesLog).toContain("RECALCULO_MODULO")
    expect(accionesLog).toContain("RECALCULO_AREA")
    expect(accionesLog).toContain("RECALCULO_CURSO")
    expect(accionesLog).toContain("RECALCULO_ETIQUETA")
  })

  it("encadena causaId al log padre", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([{ bloqueId: BLOQUE_1_ID, nota: dec(80) }])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    await service.recalcularInscripcionCompleta(INSCRIPCION_ID, ACTOR_ID, {
      causaLogId: "log-padre-uuid",
    })
    const firstCall = prisma.logActividad.create.mock.calls[0]?.[0] as {
      data: { causaId?: string }
    }
    expect(firstCall.data.causaId).toBe("log-padre-uuid")
  })

  it("solo etiqueta cambia (cruce de umbral) emite RECALCULO_CURSO + RECALCULO_ETIQUETA", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([
      { bloqueId: BLOQUE_1_ID, nota: dec(90) },
      { bloqueId: BLOQUE_2_ID, nota: dec(90) },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    // Antes: nota 70 APROBADO; despues: nota 90 EXCELENCIA.
    const agregadosAntes: AgregadosInscripcion = {
      notasModulo: new Map([[MODULO_A_ID, 70]]),
      notasArea: new Map([[AREA_A_ID, 70]]),
      notaCurso: 70,
      etiqueta: "APROBADO",
    }
    const result = await service.recalcularInscripcionCompleta(INSCRIPCION_ID, ACTOR_ID, {
      agregadosAntes,
    })
    expect(result.diff.etiquetaCambio?.antes).toBe("APROBADO")
    expect(result.diff.etiquetaCambio?.despues).toBe("EXCELENCIA")
    expect(result.diff.cursoCambio?.antes).toBe(70)
    expect(result.diff.cursoCambio?.despues).toBe(90)
    expect(result.logsEmitidos).toBe(4)
  })

  it("tx opcional: usa el cliente pasado en vez de this.prisma", async () => {
    const { service } = buildService()
    const tx: PrismaMock = {
      inscripcion: { findUnique: vi.fn() },
      entregaBloque: { findMany: vi.fn().mockResolvedValue([]) },
      entregaProyecto: { findMany: vi.fn().mockResolvedValue([]) },
      logActividad: { create: vi.fn().mockResolvedValue({ id: "log-tx" }) },
    }
    tx.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    tx.inscripcion.findUnique.mockResolvedValueOnce(buildInscripcionMock())

    await service.recalcularInscripcionCompleta(
      INSCRIPCION_ID,
      ACTOR_ID,
      {},
      tx as unknown as Prisma.TransactionClient,
    )
    // Lectura del snapshot ocurrio sobre tx, no sobre this.prisma.
    expect(tx.inscripcion.findUnique).toHaveBeenCalled()
  })

  it("rollback: si logActividad.create falla, el error se propaga", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([{ bloqueId: BLOQUE_1_ID, nota: dec(80) }])
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.logActividad.create.mockRejectedValueOnce(new Error("DB error"))

    await expect(service.recalcularInscripcionCompleta(INSCRIPCION_ID, ACTOR_ID)).rejects.toThrow(
      "DB error",
    )
  })
})

// =============================================================================
// recalcularInscripcionTrasEntregaBloque / Proyecto · wrappers
// =============================================================================

describe("recalcularInscripcionTrasEntregaBloque", () => {
  it("delega en cadena completa y respeta agregadosAntes", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(buildInscripcionMock())
    prisma.entregaBloque.findMany.mockResolvedValue([{ bloqueId: BLOQUE_1_ID, nota: dec(80) }])
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const result = await service.recalcularInscripcionTrasEntregaBloque(
      INSCRIPCION_ID,
      BLOQUE_1_ID,
      ACTOR_ID,
    )
    expect(result.diff.sinCambios).toBe(false)
  })
})

describe("recalcularInscripcionTrasEntregaProyecto", () => {
  it("transversal: cadena curso → etiqueta", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(
      buildInscripcionMock({
        modulos: [],
        cursoAreas: [],
        pesoAreas: 0,
        pesoProyectoTransversal: 100,
        pesoEntrevistaIA: 0,
      }),
    )
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaProyecto.findMany.mockResolvedValue([
      {
        miniProyectoId: null,
        transversalId: "tr-1",
        notaFinal: dec(85),
        intento: 1,
        miniProyecto: null,
      },
    ])

    const result = await service.recalcularInscripcionTrasEntregaProyecto(
      INSCRIPCION_ID,
      "entrega-x",
      ACTOR_ID,
    )
    // Sin areas/modulos: solo emite RECALCULO_CURSO + RECALCULO_ETIQUETA.
    expect(result.diff.modulosCambiados).toHaveLength(0)
    expect(result.diff.areasCambiadas).toHaveLength(0)
    expect(result.diff.cursoCambio?.despues).toBe(85)
    expect(result.diff.etiquetaCambio?.despues).toBe("APROBADO")
    expect(result.logsEmitidos).toBe(2)
  })

  it("mini: cadena modulo → area → curso → etiqueta", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValueOnce({ id: INSCRIPCION_ID })
    prisma.inscripcion.findUnique.mockResolvedValueOnce(
      buildInscripcionMock({
        modulos: [
          {
            id: MODULO_A_ID,
            areaId: AREA_A_ID,
            miniProyectoActivo: true,
            secciones: [],
          },
        ],
      }),
    )
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaProyecto.findMany.mockResolvedValue([
      {
        miniProyectoId: "mini-1",
        transversalId: null,
        notaFinal: dec(95),
        intento: 1,
        miniProyecto: { moduloId: MODULO_A_ID },
      },
    ])

    const result = await service.recalcularInscripcionTrasEntregaProyecto(
      INSCRIPCION_ID,
      "entrega-mini",
      ACTOR_ID,
    )
    // sin actividades, solo mini → modulo = 95 (peso mini efectivo).
    expect(result.diff.modulosCambiados).toHaveLength(1)
    expect(result.diff.modulosCambiados[0]?.despues).toBe(95)
    expect(result.diff.etiquetaCambio?.despues).toBe("EXCELENCIA")
    expect(result.logsEmitidos).toBe(4)
  })
})
