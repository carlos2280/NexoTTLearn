// Iter 10 · tests del FichaService (E4) + helpers puros (CTAs).

import { NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { RecalculoService } from "../recalculo/recalculo.service"
import type { AgregadosInscripcion } from "../recalculo/recalculo.types"
import { FichaService, construirCtas } from "./ficha.service"

const PARTICIPANTE_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000010"
const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000020"
const AREA_A = "00000000-0000-0000-0000-000000000030"

type Stub = ReturnType<typeof vi.fn>

interface PrismaStubs {
  usuario: { findUnique: Stub }
  expedienteEntry: { findMany: Stub }
  expedienteEntryArea: { findMany: Stub }
  inscripcion: { findMany: Stub }
  asignacion: { findMany: Stub }
  modulo: { findMany: Stub }
  entregaProyecto: { findMany: Stub; findFirst: Stub }
  entregaBloque: { findMany: Stub }
  entrevistaIASesion: { findMany: Stub; findFirst: Stub }
  estadoModuloInscripcion: { findMany: Stub }
}

function buildPrisma(): PrismaStubs {
  return {
    usuario: { findUnique: vi.fn() },
    expedienteEntry: { findMany: vi.fn().mockResolvedValue([]) },
    expedienteEntryArea: { findMany: vi.fn().mockResolvedValue([]) },
    inscripcion: { findMany: vi.fn().mockResolvedValue([]) },
    asignacion: { findMany: vi.fn().mockResolvedValue([]) },
    modulo: { findMany: vi.fn().mockResolvedValue([]) },
    entregaProyecto: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
    entregaBloque: { findMany: vi.fn().mockResolvedValue([]) },
    entrevistaIASesion: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
    estadoModuloInscripcion: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

function buildService(prisma: PrismaStubs = buildPrisma()) {
  const recalculo = new RecalculoService(prisma as unknown as PrismaService)
  const snapshotIns = vi.fn<(insId: string) => Promise<AgregadosInscripcion>>()
  recalculo.snapshotAgregados = snapshotIns as unknown as RecalculoService["snapshotAgregados"]
  const service = new FichaService(prisma as unknown as PrismaService, recalculo)
  return { service, prisma, snapshotIns }
}

function usuarioBase(extra: Record<string, unknown> = {}) {
  return {
    id: PARTICIPANTE_ID,
    nombre: "Ana",
    apellido: "Lopez",
    email: "ana@example.com",
    rol: "PARTICIPANTE",
    bloqueado: false,
    mfaActivado: false,
    ...extra,
  }
}

// =========================================================================
// CTAs (puro)
// =========================================================================

describe("construirCtas", () => {
  it("usuario sin cursos ni expediente: solo cuenta", () => {
    const ctas = construirCtas({
      bloqueado: false,
      mfaActivado: false,
      tieneCursosActivos: false,
      tieneExpediente: false,
    })
    expect(ctas).toEqual(["RESET_PASSWORD", "BLOQUEAR", "ACTIVAR_MFA"])
  })

  it("usuario con cursos activos: incluye AJUSTAR_NOTA / REASIGNAR / DESINSCRIBIR", () => {
    const ctas = construirCtas({
      bloqueado: false,
      mfaActivado: false,
      tieneCursosActivos: true,
      tieneExpediente: false,
    })
    expect(ctas).toContain("AJUSTAR_NOTA")
    expect(ctas).toContain("REASIGNAR_MODULO")
    expect(ctas).toContain("DESINSCRIBIR")
  })

  it("usuario bloqueado: DESBLOQUEAR (no BLOQUEAR)", () => {
    const ctas = construirCtas({
      bloqueado: true,
      mfaActivado: true,
      tieneCursosActivos: false,
      tieneExpediente: false,
    })
    expect(ctas).toContain("DESBLOQUEAR")
    expect(ctas).not.toContain("BLOQUEAR")
    expect(ctas).toContain("RESET_MFA")
  })

  it("usuario con expediente: incluye AJUSTAR_EXPEDIENTE", () => {
    const ctas = construirCtas({
      bloqueado: false,
      mfaActivado: false,
      tieneCursosActivos: false,
      tieneExpediente: true,
    })
    expect(ctas).toContain("AJUSTAR_EXPEDIENTE")
  })
})

// =========================================================================
// E4 · ficha
// =========================================================================

describe("FichaService.obtenerFicha", () => {
  it("404 si participante no existe", async () => {
    const { service, prisma } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(null)
    await expect(service.obtenerFicha(PARTICIPANTE_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("ficha vacia: usuario sin cursos ni expediente", async () => {
    const { service, prisma } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase())
    const resp = await service.obtenerFicha(PARTICIPANTE_ID)
    expect(resp.datosPersonales.email).toBe("ana@example.com")
    expect(resp.expediente).toEqual([])
    expect(resp.cursosActivos).toEqual([])
    expect(resp.cursosCerrados).toEqual([])
    expect(resp.estadisticaPorArea).toEqual([])
    expect(resp.historialEntregas).toEqual([])
    expect(resp.historialEntrevistasIA).toEqual([])
    expect(resp.ctas).toContain("RESET_PASSWORD")
  })

  it("expediente: mapea entries con notasArea y etiqueta", async () => {
    const { service, prisma } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase())
    prisma.expedienteEntry.findMany.mockResolvedValue([
      {
        cursoId: CURSO_ID,
        tituloCurso: "React Avanzado",
        empresaCliente: "ACME",
        fechaCompletitud: new Date("2026-01-01T00:00:00Z"),
        notaGlobal: new Prisma.Decimal(85),
        etiqueta: "APROBADO",
        notasPorArea: [
          { areaId: AREA_A, nombreAreaSnapshot: "Frontend", puntaje: new Prisma.Decimal(85) },
        ],
      },
    ])
    const resp = await service.obtenerFicha(PARTICIPANTE_ID)
    expect(resp.expediente).toHaveLength(1)
    expect(resp.expediente[0]?.notaGlobal).toBe(85)
    expect(resp.expediente[0]?.etiqueta).toBe("APROBADO")
    expect(resp.expediente[0]?.notasArea[0]?.nombre).toBe("Frontend")
    expect(resp.ctas).toContain("AJUSTAR_EXPEDIENTE")
  })

  it("cursos activos: clasifica con D-10.3 y calcula pctAvance", async () => {
    const { service, prisma, snapshotIns } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase())
    prisma.inscripcion.findMany.mockResolvedValue([
      {
        id: INSCRIPCION_ID,
        estado: "ACTIVA",
        abandonadaAt: null,
        cerradaSinCompletarAt: null,
        cursoId: CURSO_ID,
        curso: {
          id: CURSO_ID,
          titulo: "React Basico",
          empresaCliente: "ACME",
          umbralExcelencia: 90,
          umbralAprobado: 70,
          umbralEnDesarrollo: 50,
          cursoAreas: [{ areaId: AREA_A, puntajeObjetivo: 70 }],
          proyectoTransversal: null,
          entrevistaIAConfig: null,
        },
      },
    ])
    snapshotIns.mockResolvedValue({
      notasModulo: new Map(),
      notasArea: new Map(),
      notaCurso: null,
      etiqueta: null,
    })
    prisma.estadoModuloInscripcion.findMany.mockResolvedValue([
      { porcentajeAvance: 60, estado: "EN_PROGRESO" },
      { porcentajeAvance: 40, estado: "EN_PROGRESO" },
    ])

    const resp = await service.obtenerFicha(PARTICIPANTE_ID)
    expect(resp.cursosActivos).toHaveLength(1)
    expect(resp.cursosActivos[0]?.pctAvance).toBe(50)
    // Sin OBLIGATORIO asignado y sin INSUFICIENTE → EnRuta.
    expect(resp.cursosActivos[0]?.estadoSeguimiento).toBe("EnRuta")
  })

  it("cursos cerrados: ABANDONADA mapea fecha desde abandonadaAt", async () => {
    const { service, prisma } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase())
    prisma.inscripcion.findMany.mockResolvedValue([
      {
        id: INSCRIPCION_ID,
        estado: "ABANDONADA",
        abandonadaAt: new Date("2026-02-01T00:00:00Z"),
        cerradaSinCompletarAt: null,
        cursoId: CURSO_ID,
        curso: {
          id: CURSO_ID,
          titulo: "x",
          empresaCliente: "y",
          umbralExcelencia: 90,
          umbralAprobado: 70,
          umbralEnDesarrollo: 50,
          cursoAreas: [],
          proyectoTransversal: null,
          entrevistaIAConfig: null,
        },
      },
    ])
    const resp = await service.obtenerFicha(PARTICIPANTE_ID)
    expect(resp.cursosActivos).toEqual([])
    expect(resp.cursosCerrados).toHaveLength(1)
    expect(resp.cursosCerrados[0]?.estado).toBe("ABANDONADA")
    expect(resp.cursosCerrados[0]?.fecha).toBe("2026-02-01T00:00:00.000Z")
  })

  it("estadistica por area: agrega mejor/peor/cursosTocados/fechaUltima", async () => {
    const { service, prisma } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase())
    prisma.expedienteEntryArea.findMany.mockResolvedValue([
      {
        areaId: AREA_A,
        nombreAreaSnapshot: "Frontend",
        puntaje: new Prisma.Decimal(80),
        entry: { fechaCompletitud: new Date("2025-06-01") },
      },
      {
        areaId: AREA_A,
        nombreAreaSnapshot: "Frontend",
        puntaje: new Prisma.Decimal(90),
        entry: { fechaCompletitud: new Date("2025-12-01") },
      },
    ])
    const resp = await service.obtenerFicha(PARTICIPANTE_ID)
    expect(resp.estadisticaPorArea).toHaveLength(1)
    const stat = resp.estadisticaPorArea[0]
    expect(stat?.mejorNota).toBe(90)
    expect(stat?.peorNota).toBe(80)
    expect(stat?.cursosTocados).toBe(2)
    expect(stat?.fechaUltima).toBe("2025-12-01T00:00:00.000Z")
  })

  it("historial entregas: combina BLOQUE + PROYECTO ordenado desc por enviadaAt", async () => {
    const { service, prisma } = buildService()
    prisma.usuario.findUnique.mockResolvedValue(usuarioBase())
    const newer = new Date("2026-03-01T00:00:00Z")
    const older = new Date("2026-01-01T00:00:00Z")
    prisma.entregaBloque.findMany.mockResolvedValue([
      {
        id: "b1",
        inscripcionId: INSCRIPCION_ID,
        nota: new Prisma.Decimal(70),
        estado: "EVALUADA",
        enviadaAt: older,
        evaluadaAt: older,
        inscripcion: { cursoId: CURSO_ID, curso: { titulo: "C1" } },
      },
    ])
    prisma.entregaProyecto.findMany.mockResolvedValue([
      {
        id: "p1",
        inscripcionId: INSCRIPCION_ID,
        notaFinal: new Prisma.Decimal(85),
        estado: "EVALUADA",
        enviadaAt: newer,
        evaluadaAt: newer,
        inscripcion: { cursoId: CURSO_ID, curso: { titulo: "C1" } },
      },
    ])
    const resp = await service.obtenerFicha(PARTICIPANTE_ID)
    expect(resp.historialEntregas).toHaveLength(2)
    expect(resp.historialEntregas[0]?.tipo).toBe("PROYECTO")
    expect(resp.historialEntregas[1]?.tipo).toBe("BLOQUE")
  })
})
