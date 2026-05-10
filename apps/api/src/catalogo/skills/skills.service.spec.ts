import { NotFoundException } from "@nestjs/common"
import { EstadoSkill } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { SkillsService } from "./skills.service"

interface MockPrisma {
  skill: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    skill: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

const FECHA = new Date("2026-01-01T00:00:00Z")

function buildSkillRow() {
  return {
    id: "skill-1",
    etiquetaVisible: "Node.js",
    areaId: "area-1",
    estado: EstadoSkill.ACTIVA,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let service: SkillsService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new SkillsService(prisma as unknown as PrismaService)
})

describe("SkillsService.listar", () => {
  it("happy path: devuelve datos mapeados con orderBy etiquetaVisible asc", async () => {
    prisma.skill.findMany.mockResolvedValue([buildSkillRow()])
    prisma.skill.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    expect(res.data[0]?.etiquetaVisible).toBe("Node.js")
    expect(prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { etiquetaVisible: "asc" }, where: {} }),
    )
  })

  it("filtros areaId + estado + q se combinan en el where", async () => {
    prisma.skill.findMany.mockResolvedValue([])
    prisma.skill.count.mockResolvedValue(0)

    await service.listar({
      page: 1,
      pageSize: 20,
      areaId: "area-1",
      estado: EstadoSkill.ARCHIVADA,
      q: "no",
    })
    expect(prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          areaId: "area-1",
          estado: EstadoSkill.ARCHIVADA,
          etiquetaVisible: { contains: "no", mode: "insensitive" },
        },
      }),
    )
  })

  it("pagina 2 con pageSize 5: skip=5, take=5", async () => {
    prisma.skill.findMany.mockResolvedValue([])
    prisma.skill.count.mockResolvedValue(0)

    await service.listar({ page: 2, pageSize: 5 })
    expect(prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, skip: 5 }),
    )
  })

  it("mapper solo expone los campos del SELECT", async () => {
    prisma.skill.findMany.mockResolvedValue([buildSkillRow()])
    prisma.skill.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    const primero = res.data[0]
    expect(primero).toBeDefined()
    if (!primero) {
      return
    }
    expect(Object.keys(primero)).toEqual([
      "id",
      "etiquetaVisible",
      "areaId",
      "estado",
      "createdAt",
      "updatedAt",
    ])
  })
})

describe("SkillsService.obtenerPorIdOrThrow", () => {
  it("happy path: devuelve la skill mapeada", async () => {
    prisma.skill.findUnique.mockResolvedValue(buildSkillRow())
    const res = await service.obtenerPorIdOrThrow("skill-1")
    expect(res.areaId).toBe("area-1")
  })

  it("inexistente: NotFoundException con code SKILL_NO_ENCONTRADA", async () => {
    prisma.skill.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no-existe")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.skillNoEncontrada)
    }
  })
})
