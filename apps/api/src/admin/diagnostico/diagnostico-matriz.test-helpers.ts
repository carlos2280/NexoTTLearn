import { vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { DiagnosticoMatrizService } from "./diagnostico-matriz.service"

type Stub = ReturnType<typeof vi.fn>

export interface PrismaMock {
  curso: { findUnique: Stub }
  cursoArea: { findMany: Stub }
  inscripcion: { findMany: Stub }
}

export function buildPrisma(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    cursoArea: { findMany: vi.fn() },
    inscripcion: { findMany: vi.fn() },
  }
}

export function buildService(prisma: PrismaMock = buildPrisma()) {
  return { service: new DiagnosticoMatrizService(prisma as unknown as PrismaService), prisma }
}

export const CURSO_ID = "00000000-0000-0000-0000-000000000001"

export function buildCursoArea(overrides: { areaId: string; objetivo?: number; orden?: number }) {
  return {
    id: `ca-${overrides.areaId}`,
    areaId: overrides.areaId,
    peso: 50,
    puntajeObjetivo: overrides.objetivo ?? 70,
    orden: overrides.orden ?? 0,
    area: { id: overrides.areaId, nombre: `Area ${overrides.areaId}`, color: "#7c3aed" },
  }
}

export function buildInscripcion(overrides: {
  id: string
  notasPorArea?: Record<string, number>
  apellido?: string
}) {
  const notas = overrides.notasPorArea ?? {}
  return {
    id: overrides.id,
    participante: {
      id: `u-${overrides.id}`,
      nombre: "Juan",
      apellido: overrides.apellido ?? "Perez",
      email: `${overrides.id}@ntt.com`,
    },
    evaluacionesIniciales: Object.entries(notas).map(([areaId, puntaje]) => ({ areaId, puntaje })),
  }
}
