import { vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { AsignacionesConfirmarLoteService } from "./asignaciones-confirmar-lote.service"
import { AsignacionesInscripcionService } from "./asignaciones-inscripcion.service"
import { AsignacionesMatrizService } from "./asignaciones-matriz.service"

type Stub = ReturnType<typeof vi.fn>

export interface PrismaMock {
  curso: { findUnique: Stub; findUniqueOrThrow: Stub }
  cursoArea: { findMany: Stub }
  modulo: { findMany: Stub; count: Stub }
  inscripcion: { findUnique: Stub; findMany: Stub }
  asignacion: { deleteMany: Stub; createMany: Stub; update: Stub; delete: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

export function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    cursoArea: { findMany: vi.fn() },
    modulo: { findMany: vi.fn(), count: vi.fn() },
    inscripcion: { findUnique: vi.fn(), findMany: vi.fn() },
    asignacion: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    logActividad: { create: vi.fn() },
    $transaction: vi.fn((arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: PrismaMock) => Promise<unknown>)(prisma)
      }
      return Promise.all(arg as Promise<unknown>[])
    }),
  }
  return prisma
}

export function buildMatrizService(prisma: PrismaMock = buildPrisma()) {
  return {
    service: new AsignacionesMatrizService(prisma as unknown as PrismaService),
    prisma,
  }
}

export function buildInscripcionService(prisma: PrismaMock = buildPrisma()) {
  return {
    service: new AsignacionesInscripcionService(prisma as unknown as PrismaService),
    prisma,
  }
}

export function buildConfirmarLoteService(prisma: PrismaMock = buildPrisma()) {
  return {
    service: new AsignacionesConfirmarLoteService(prisma as unknown as PrismaService),
    prisma,
  }
}

export const CURSO_ID = "00000000-0000-0000-0000-000000000a01"
export const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000a02"
export const ACTOR_ID = "00000000-0000-0000-0000-000000000a03"
export const AREA_FE_ID = "00000000-0000-0000-0000-000000000af1"
export const AREA_BE_ID = "00000000-0000-0000-0000-000000000af2"
export const MODULO_FE_ID = "00000000-0000-0000-0000-000000000af3"
export const MODULO_BE_ID = "00000000-0000-0000-0000-000000000af4"

export function buildCursoAreas() {
  return [
    {
      id: "ca-fe",
      areaId: AREA_FE_ID,
      puntajeObjetivo: 70,
      orden: 1,
      area: { id: AREA_FE_ID, nombre: "Frontend", color: "#7c3aed" },
    },
    {
      id: "ca-be",
      areaId: AREA_BE_ID,
      puntajeObjetivo: 70,
      orden: 2,
      area: { id: AREA_BE_ID, nombre: "Backend", color: "#22d3ee" },
    },
  ]
}

export function buildModulos() {
  return [
    {
      id: MODULO_FE_ID,
      titulo: "Frontend HTML+React",
      orden: 1,
      areaId: AREA_FE_ID,
      archivadoAt: null,
    },
    {
      id: MODULO_BE_ID,
      titulo: "Backend Python+APIs",
      orden: 2,
      areaId: AREA_BE_ID,
      archivadoAt: null,
    },
  ]
}

interface InscripcionRowOverrides {
  readonly notaFe?: number | null
  readonly notaBe?: number | null
  readonly tipo?: "SOLICITUD" | "LIBRE"
  readonly asignaciones?: { moduloId: string; tipo: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL" }[]
}

export function buildInscripcionRow(overrides: InscripcionRowOverrides = {}) {
  const evals: { areaId: string; puntaje: number }[] = []
  if (overrides.notaFe != null) {
    evals.push({ areaId: AREA_FE_ID, puntaje: overrides.notaFe })
  }
  if (overrides.notaBe != null) {
    evals.push({ areaId: AREA_BE_ID, puntaje: overrides.notaBe })
  }
  return {
    id: INSCRIPCION_ID,
    cursoId: CURSO_ID,
    estado: "ACTIVA" as const,
    tipo: overrides.tipo ?? ("SOLICITUD" as const),
    participante: { id: "u-1", nombre: "Juan", apellido: "Perez", email: "juan@ntt.com" },
    evaluacionesIniciales: evals,
    asignaciones: (overrides.asignaciones ?? []).map((a) => ({
      moduloId: a.moduloId,
      tipo: a.tipo,
      asignadaAt: new Date("2026-05-04T09:00:00Z"),
      modificadaAt: null,
    })),
  }
}
