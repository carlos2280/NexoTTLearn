import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { AreasService } from "./areas.service"

interface MockPrisma {
  area: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    area: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  // $transaction([findMany, count]) ejecuta ambas en paralelo. En el mock las
  // ejecutamos secuencialmente y devolvemos la tupla en orden.
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

const FECHA = new Date("2026-01-01T00:00:00Z")

function buildAreaRow(overrides: Partial<{ id: string; nombre: string }> = {}) {
  return {
    id: overrides.id ?? "area-1",
    nombre: overrides.nombre ?? "Backend",
    descripcion: "desc",
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let service: AreasService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new AreasService(prisma as unknown as PrismaService)
})

describe("AreasService.listar", () => {
  it("happy path: pagina por defecto devuelve datos mapeados y meta correcta", async () => {
    prisma.area.findMany.mockResolvedValue([buildAreaRow()])
    prisma.area.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })

    expect(res.data).toHaveLength(1)
    expect(res.data[0]).toEqual({
      id: "area-1",
      nombre: "Backend",
      descripcion: "desc",
      createdAt: FECHA.toISOString(),
      updatedAt: FECHA.toISOString(),
    })
    expect(res.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 })
    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, take: 20, skip: 0, orderBy: { nombre: "asc" } }),
    )
  })

  it("pagina fuera de rango: devuelve data vacia con total absoluto", async () => {
    prisma.area.findMany.mockResolvedValue([])
    prisma.area.count.mockResolvedValue(3)

    const res = await service.listar({ page: 99, pageSize: 20 })

    expect(res.data).toEqual([])
    expect(res.meta.total).toBe(3)
    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: (99 - 1) * 20 }),
    )
  })

  it("filtro q: aplica where con contains case-insensitive sobre nombre", async () => {
    prisma.area.findMany.mockResolvedValue([])
    prisma.area.count.mockResolvedValue(0)

    await service.listar({ page: 1, pageSize: 20, q: "back" })

    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { nombre: { contains: "back", mode: "insensitive" } },
      }),
    )
  })

  it("mapper no devuelve campos extra del row Prisma", async () => {
    prisma.area.findMany.mockResolvedValue([
      { ...buildAreaRow(), camposInternosImaginarios: "no expone" },
    ])
    prisma.area.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    const primero = res.data[0]
    expect(primero).toBeDefined()
    if (!primero) {
      return
    }
    expect(primero).not.toHaveProperty("camposInternosImaginarios")
    expect(Object.keys(primero)).toEqual(["id", "nombre", "descripcion", "createdAt", "updatedAt"])
  })
})

describe("AreasService.obtenerPorIdOrThrow", () => {
  it("happy path: devuelve el area mapeada", async () => {
    prisma.area.findUnique.mockResolvedValue(buildAreaRow())
    const res = await service.obtenerPorIdOrThrow("area-1")
    expect(res.id).toBe("area-1")
    expect(res.nombre).toBe("Backend")
  })

  it("inexistente: lanza NotFoundException con code AREA_NO_ENCONTRADA", async () => {
    prisma.area.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no-existe")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.areaNoEncontrada)
    }
  })
})
