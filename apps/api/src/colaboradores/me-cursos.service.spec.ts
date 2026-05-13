import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import { MeCursosService } from "./me-cursos.service"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const findMany = vi.fn().mockResolvedValue([])
  const count = vi.fn().mockResolvedValue(0)
  return {
    usuario: { findUnique: vi.fn() },
    asignacionCurso: { findMany, count },
    $transaction: vi.fn(async (operations: readonly unknown[]) => {
      return await Promise.all(operations as Array<Promise<unknown>>)
    }),
  }
}

function buildPlanMock(porcentaje = 33): { obtenerPorcentajeAvance: ReturnType<typeof vi.fn> } {
  return { obtenerPorcentajeAvance: vi.fn().mockResolvedValue(porcentaje) }
}

const USER = "11111111-1111-1111-1111-111111111111"
const COLAB = "22222222-2222-2222-2222-222222222222"
const ASIG_1 = "33333333-3333-3333-3333-333333333333"
const ASIG_2 = "44444444-4444-4444-4444-444444444444"
const CURSO_1 = "55555555-5555-5555-5555-555555555555"
const CURSO_2 = "66666666-6666-6666-6666-666666666666"

function asignacionRow(opts: {
  id?: string
  cursoId?: string
  rol?: "ASIGNADO" | "VOLUNTARIO"
  estado?: "ACTIVO" | "CERRADO" | "BORRADOR"
}): unknown {
  return {
    id: opts.id ?? ASIG_1,
    rol: opts.rol ?? "ASIGNADO",
    estadoAsignado: opts.rol === "VOLUNTARIO" ? null : "ASIGNADO",
    estadoVoluntario: opts.rol === "VOLUNTARIO" ? "INSCRITO" : null,
    createdAt: new Date("2026-04-01T10:00:00Z"),
    curso: {
      id: opts.cursoId ?? CURSO_1,
      titulo: "Curso demo",
      estado: opts.estado ?? "ACTIVO",
      fechaDeadline: new Date("2026-09-30T00:00:00Z"),
    },
  }
}

describe("MeCursosService.listarMisCursos", () => {
  let prisma: PrismaMock
  let plan: ReturnType<typeof buildPlanMock>
  let service: MeCursosService

  beforeEach(() => {
    prisma = buildPrismaMock()
    plan = buildPlanMock()
    service = new MeCursosService(
      prisma as unknown as PrismaService,
      plan as unknown as PlanPersonalService,
    )
  })

  it("404 si el usuario no tiene colaborador asociado", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.listarMisCursos(USER, { page: 1, pageSize: 20, estado: "TODOS", rol: "TODOS" }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("happy: devuelve resumen paginado con porcentaje del motor", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      asignacionRow({ id: ASIG_1, cursoId: CURSO_1 }),
      asignacionRow({ id: ASIG_2, cursoId: CURSO_2 }),
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(2)
    plan.obtenerPorcentajeAvance.mockResolvedValueOnce(50).mockResolvedValueOnce(75)

    const out = await service.listarMisCursos(USER, {
      page: 1,
      pageSize: 20,
      estado: "TODOS",
      rol: "TODOS",
    })

    expect(out.meta.total).toBe(2)
    expect(out.data).toHaveLength(2)
    expect(out.data[0]?.porcentajeAvance).toBe(50)
    expect(out.data[1]?.porcentajeAvance).toBe(75)
    expect(plan.obtenerPorcentajeAvance).toHaveBeenCalledWith(ASIG_1)
    expect(plan.obtenerPorcentajeAvance).toHaveBeenCalledWith(ASIG_2)
  })

  it("voluntario sin plan: porcentaje=0 sin invocar el motor", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      asignacionRow({ id: ASIG_1, rol: "VOLUNTARIO" }),
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)

    const out = await service.listarMisCursos(USER, {
      page: 1,
      pageSize: 20,
      estado: "TODOS",
      rol: "TODOS",
    })

    expect(out.data[0]?.porcentajeAvance).toBe(0)
    expect(out.data[0]?.rol).toBe("VOLUNTARIO")
    expect(plan.obtenerPorcentajeAvance).not.toHaveBeenCalled()
  })

  it("filtros: aplica estado curso y rol al where", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([])
    prisma.asignacionCurso.count.mockResolvedValueOnce(0)

    await service.listarMisCursos(USER, {
      page: 1,
      pageSize: 20,
      estado: "ACTIVO",
      rol: "ASIGNADO",
    })

    const findManyCall = prisma.asignacionCurso.findMany.mock.calls[0]?.[0] as {
      where: { colaboradorId: string; rol: string; curso: { estado: string } }
    }
    expect(findManyCall.where.colaboradorId).toBe(COLAB)
    expect(findManyCall.where.rol).toBe("ASIGNADO")
    expect(findManyCall.where.curso.estado).toBe("ACTIVO")
  })
})
