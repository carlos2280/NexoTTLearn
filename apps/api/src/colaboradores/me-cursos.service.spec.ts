import { NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
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
  cursoSkillExigida: { findMany: ReturnType<typeof vi.fn> }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  aperturaSeccion: { count: ReturnType<typeof vi.fn> }
  seccion: { count: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const findManyAsig = vi.fn().mockResolvedValue([])
  const countAsig = vi.fn().mockResolvedValue(0)
  return {
    usuario: { findUnique: vi.fn() },
    asignacionCurso: { findMany: findManyAsig, count: countAsig },
    cursoSkillExigida: { findMany: vi.fn().mockResolvedValue([]) },
    notaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    aperturaSeccion: { count: vi.fn().mockResolvedValue(0) },
    seccion: { count: vi.fn().mockResolvedValue(0) },
    $transaction: vi.fn(async (operations: readonly unknown[]) => {
      return await Promise.all(operations as Promise<unknown>[])
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
const SKILL_BE_1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
const SKILL_BE_2 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
const SKILL_FE_1 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"
const AREA_BE = "cccccccc-cccc-cccc-cccc-ccccccccccc1"
const AREA_FE = "cccccccc-cccc-cccc-cccc-ccccccccccc2"

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

function skillExigida(opts: {
  cursoId: string
  skillId: string
  notaMinima: number
  areaId: string
  areaCodigo: string
  areaNombre: string
}): unknown {
  return {
    cursoId: opts.cursoId,
    skillId: opts.skillId,
    notaMinima: new Prisma.Decimal(opts.notaMinima),
    skill: {
      area: { id: opts.areaId, codigo: opts.areaCodigo, nombre: opts.areaNombre },
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

  it("voluntario con aperturas: porcentaje = aperturas / total del curso (no invoca el motor)", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      asignacionRow({ id: ASIG_1, rol: "VOLUNTARIO" }),
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    // 2 secciones abiertas de 8 totales del curso = 25%.
    prisma.aperturaSeccion.count.mockResolvedValueOnce(2)
    prisma.seccion.count.mockResolvedValueOnce(8)

    const out = await service.listarMisCursos(USER, {
      page: 1,
      pageSize: 20,
      estado: "TODOS",
      rol: "TODOS",
    })

    expect(out.data[0]?.porcentajeAvance).toBe(25)
    expect(out.data[0]?.rol).toBe("VOLUNTARIO")
    expect(plan.obtenerPorcentajeAvance).not.toHaveBeenCalled()
  })

  it("voluntario sin aperturas: porcentaje=0", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      asignacionRow({ id: ASIG_1, rol: "VOLUNTARIO" }),
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    prisma.aperturaSeccion.count.mockResolvedValueOnce(0)
    prisma.seccion.count.mockResolvedValueOnce(8)

    const out = await service.listarMisCursos(USER, {
      page: 1,
      pageSize: 20,
      estado: "TODOS",
      rol: "TODOS",
    })

    expect(out.data[0]?.porcentajeAvance).toBe(0)
  })

  it("voluntario en curso sin secciones declaradas: porcentaje=0 sin division por cero", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      asignacionRow({ id: ASIG_1, rol: "VOLUNTARIO" }),
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    prisma.aperturaSeccion.count.mockResolvedValueOnce(0)
    prisma.seccion.count.mockResolvedValueOnce(0)

    const out = await service.listarMisCursos(USER, {
      page: 1,
      pageSize: 20,
      estado: "TODOS",
      rol: "TODOS",
    })
    expect(out.data[0]?.porcentajeAvance).toBe(0)
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

  describe("B-2 / B-extra.1: skillsPendientesCount + area dominante", () => {
    it("cuenta skills sin nota o con nota < notaMinima y elige area mas representada", async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
      prisma.asignacionCurso.findMany.mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1 }),
      ])
      prisma.asignacionCurso.count.mockResolvedValueOnce(1)
      prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([
        skillExigida({
          cursoId: CURSO_1,
          skillId: SKILL_BE_1,
          notaMinima: 70,
          areaId: AREA_BE,
          areaCodigo: "backend",
          areaNombre: "Backend",
        }),
        skillExigida({
          cursoId: CURSO_1,
          skillId: SKILL_BE_2,
          notaMinima: 70,
          areaId: AREA_BE,
          areaCodigo: "backend",
          areaNombre: "Backend",
        }),
        skillExigida({
          cursoId: CURSO_1,
          skillId: SKILL_FE_1,
          notaMinima: 60,
          areaId: AREA_FE,
          areaCodigo: "frontend",
          areaNombre: "Frontend",
        }),
      ])
      prisma.notaSkill.findMany.mockResolvedValueOnce([
        { skillId: SKILL_BE_1, notaActual: new Prisma.Decimal(85) },
        { skillId: SKILL_BE_2, notaActual: new Prisma.Decimal(40) },
        // SKILL_FE_1 sin nota → pendiente.
      ])

      const out = await service.listarMisCursos(USER, {
        page: 1,
        pageSize: 20,
        estado: "TODOS",
        rol: "TODOS",
      })

      expect(out.data[0]?.skillsPendientesCount).toBe(2)
      expect(out.data[0]?.areaCodigo).toBe("backend")
      expect(out.data[0]?.areaNombre).toBe("Backend")
    })

    it("curso con todas las skills demostradas: skillsPendientesCount = 0", async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
      prisma.asignacionCurso.findMany.mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1 }),
      ])
      prisma.asignacionCurso.count.mockResolvedValueOnce(1)
      prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([
        skillExigida({
          cursoId: CURSO_1,
          skillId: SKILL_BE_1,
          notaMinima: 70,
          areaId: AREA_BE,
          areaCodigo: "backend",
          areaNombre: "Backend",
        }),
      ])
      prisma.notaSkill.findMany.mockResolvedValueOnce([
        { skillId: SKILL_BE_1, notaActual: new Prisma.Decimal(70) },
      ])

      const out = await service.listarMisCursos(USER, {
        page: 1,
        pageSize: 20,
        estado: "TODOS",
        rol: "TODOS",
      })

      expect(out.data[0]?.skillsPendientesCount).toBe(0)
    })

    it("curso sin skills exigidas: pendientes = 0, area null (defensivo)", async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
      prisma.asignacionCurso.findMany.mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1 }),
      ])
      prisma.asignacionCurso.count.mockResolvedValueOnce(1)
      prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([])

      const out = await service.listarMisCursos(USER, {
        page: 1,
        pageSize: 20,
        estado: "TODOS",
        rol: "TODOS",
      })

      expect(out.data[0]?.skillsPendientesCount).toBe(0)
      expect(out.data[0]?.areaCodigo).toBeNull()
      expect(out.data[0]?.areaNombre).toBeNull()
      expect(prisma.notaSkill.findMany).not.toHaveBeenCalled()
    })

    it("empate en areas: desempata alfabetico por nombre", async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
      prisma.asignacionCurso.findMany.mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1 }),
      ])
      prisma.asignacionCurso.count.mockResolvedValueOnce(1)
      prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([
        skillExigida({
          cursoId: CURSO_1,
          skillId: SKILL_FE_1,
          notaMinima: 70,
          areaId: AREA_FE,
          areaCodigo: "frontend",
          areaNombre: "Frontend",
        }),
        skillExigida({
          cursoId: CURSO_1,
          skillId: SKILL_BE_1,
          notaMinima: 70,
          areaId: AREA_BE,
          areaCodigo: "backend",
          areaNombre: "Backend",
        }),
      ])

      const out = await service.listarMisCursos(USER, {
        page: 1,
        pageSize: 20,
        estado: "TODOS",
        rol: "TODOS",
      })

      expect(out.data[0]?.areaCodigo).toBe("backend")
    })

    it("ejecuta una sola query agregada para todos los cursos de la pagina (no N+1)", async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
      prisma.asignacionCurso.findMany.mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1 }),
        asignacionRow({ id: ASIG_2, cursoId: CURSO_2 }),
      ])
      prisma.asignacionCurso.count.mockResolvedValueOnce(2)

      await service.listarMisCursos(USER, {
        page: 1,
        pageSize: 20,
        estado: "TODOS",
        rol: "TODOS",
      })

      expect(prisma.cursoSkillExigida.findMany).toHaveBeenCalledTimes(1)
      const call = prisma.cursoSkillExigida.findMany.mock.calls[0]?.[0] as {
        where: { cursoId: { in: string[] } }
      }
      expect(call.where.cursoId.in).toEqual([CURSO_1, CURSO_2])
    })
  })
})
