import type { PlanResponseAdmin } from "@nexott-learn/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../common/audit/audit-log.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalRecalculoService } from "./plan-personal-recalculo.service"
import { PlanPersonalService } from "./plan-personal.service"

interface PrismaMock {
  asignacionCurso: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(rows: ReadonlyArray<{ readonly id: string }> = []): PrismaMock {
  return {
    asignacionCurso: { findMany: vi.fn().mockResolvedValue(rows) },
  }
}

function buildAuditMock(): { record: ReturnType<typeof vi.fn> } {
  return { record: vi.fn().mockResolvedValue(undefined) }
}

function buildPlanPersonalMock(): { recalcular: ReturnType<typeof vi.fn> } {
  return {
    recalcular: vi.fn().mockResolvedValue({ planId: "p" } as unknown as PlanResponseAdmin),
  }
}

const CURSO = "11111111-1111-1111-1111-111111111111"
const ASIG_1 = "22222222-2222-2222-2222-222222222221"
const ASIG_2 = "22222222-2222-2222-2222-222222222222"
const ASIG_3 = "22222222-2222-2222-2222-222222222223"
const ADMIN = "99999999-9999-9999-9999-999999999999"

describe("PlanPersonalRecalculoService.recalcularMasivo", () => {
  let prisma: PrismaMock
  let audit: ReturnType<typeof buildAuditMock>
  let planPersonal: ReturnType<typeof buildPlanPersonalMock>
  let service: PlanPersonalRecalculoService

  beforeEach(() => {
    prisma = buildPrismaMock()
    audit = buildAuditMock()
    planPersonal = buildPlanPersonalMock()
    service = new PlanPersonalRecalculoService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditLogService,
      planPersonal as unknown as PlanPersonalService,
    )
  })

  it("total=0 cuando el curso no tiene asignaciones activas", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([])

    const out = await service.recalcularMasivo(CURSO, ADMIN)

    expect(out.total).toBe(0)
    expect(out.recalculadas).toBe(0)
    expect(out.fallidas).toBe(0)
    expect(out.cursoId).toBe(CURSO)
    expect(audit.record).toHaveBeenCalledTimes(1)
  })

  it("happy: las 3 asignaciones se recalculan", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      { id: ASIG_1 },
      { id: ASIG_2 },
      { id: ASIG_3 },
    ])

    const out = await service.recalcularMasivo(CURSO, ADMIN)

    expect(planPersonal.recalcular).toHaveBeenCalledTimes(3)
    expect(out.total).toBe(3)
    expect(out.recalculadas).toBe(3)
    expect(out.fallidas).toBe(0)
  })

  it("parcial: un fallo aislado no rompe el batch", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      { id: ASIG_1 },
      { id: ASIG_2 },
      { id: ASIG_3 },
    ])
    planPersonal.recalcular
      .mockResolvedValueOnce({ planId: "p1" } as unknown as PlanResponseAdmin)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ planId: "p3" } as unknown as PlanResponseAdmin)

    const out = await service.recalcularMasivo(CURSO, ADMIN)

    expect(out.total).toBe(3)
    expect(out.recalculadas).toBe(2)
    expect(out.fallidas).toBe(1)
  })

  it("filtro: solo rol=ASIGNADO en estados activos (where esperado)", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([])

    await service.recalcularMasivo(CURSO, ADMIN)

    const callArg = prisma.asignacionCurso.findMany.mock.calls[0]?.[0] as {
      where: { cursoId: string; rol: string; estadoAsignado: { in: readonly string[] } }
    }
    expect(callArg.where.cursoId).toBe(CURSO)
    expect(callArg.where.rol).toBe("ASIGNADO")
    expect([...callArg.where.estadoAsignado.in].sort()).toEqual([
      "ASIGNADO",
      "EN_PROGRESO",
      "LISTO",
    ])
  })
})
