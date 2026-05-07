import { vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { HubDiagnosticoService } from "./hub.service"

type Stub = ReturnType<typeof vi.fn>

export interface HubPrismaMock {
  curso: { findMany: Stub }
}

export function buildHubPrisma(): HubPrismaMock {
  return { curso: { findMany: vi.fn() } }
}

export function buildHubService(prisma: HubPrismaMock = buildHubPrisma()) {
  return {
    service: new HubDiagnosticoService(prisma as unknown as PrismaService),
    prisma,
  }
}

export const HOY = new Date("2026-05-07T00:00:00Z")

interface CursoRowOverrides {
  readonly id?: string
  readonly empresaCliente?: string
  readonly titulo?: string
  readonly deadline?: Date | null
  readonly inscripciones?: ReadonlyArray<{
    readonly id: string
    readonly tieneEvaluacion: boolean
    readonly tieneAsignacion: boolean
  }>
}

export function buildCursoRow(overrides: CursoRowOverrides = {}) {
  const inscripciones = (overrides.inscripciones ?? []).map((i) => ({
    id: i.id,
    evaluacionesIniciales: i.tieneEvaluacion ? [{ id: `${i.id}-eval` }] : [],
    asignaciones: i.tieneAsignacion ? [{ id: `${i.id}-asig` }] : [],
  }))
  return {
    id: overrides.id ?? "curso-1",
    empresaCliente: overrides.empresaCliente ?? "Empresa XYZ",
    titulo: overrides.titulo ?? "Fullstack",
    deadline: overrides.deadline ?? null,
    inscripciones,
  }
}
