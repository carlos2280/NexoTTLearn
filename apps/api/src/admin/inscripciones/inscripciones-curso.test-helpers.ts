import { vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { InscripcionesCursoService } from "./inscripciones-curso.service"

type Stub = ReturnType<typeof vi.fn>

export interface PrismaMock {
  curso: { findUnique: Stub }
  inscripcion: { findUnique: Stub; findMany: Stub; count: Stub; update: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

export function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: { findUnique: vi.fn() },
    inscripcion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
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

export function buildService(prisma: PrismaMock = buildPrisma()) {
  return { service: new InscripcionesCursoService(prisma as unknown as PrismaService), prisma }
}

export const CURSO_ID = "00000000-0000-0000-0000-000000000001"
export const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000002"
export const ACTOR_ID = "00000000-0000-0000-0000-000000000003"
export const QUERY_DEFAULT = { page: 1, pageSize: 50 } as const

export function buildRow(overrides: { ultimoLoginEn?: Date | null; areasConDato?: number } = {}) {
  return {
    id: INSCRIPCION_ID,
    cursoId: CURSO_ID,
    tipo: "SOLICITUD" as const,
    estado: "ACTIVA" as const,
    inscritaAt: new Date("2026-05-04T09:00:00Z"),
    participante: {
      id: "u-1",
      nombre: "Juan",
      apellido: "Perez",
      email: "juan@ntt.com",
      ultimoLoginEn: overrides.ultimoLoginEn ?? null,
    },
    evaluacionesIniciales: Array.from({ length: overrides.areasConDato ?? 0 }, () => ({ id: "e" })),
    asignaciones: [],
  }
}
