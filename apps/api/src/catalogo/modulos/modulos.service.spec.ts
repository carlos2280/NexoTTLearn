import { NotFoundException } from "@nestjs/common"
import { EstadoModulo } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ModulosService } from "./modulos.service"

interface MockPrisma {
  modulo: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    modulo: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

const FECHA = new Date("2026-01-01T00:00:00Z")

function buildModuloRow() {
  return {
    id: "mod-1",
    titulo: "Fundamentos Node",
    descripcion: "desc",
    estado: EstadoModulo.ACTIVO,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let service: ModulosService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new ModulosService(prisma as unknown as PrismaService)
})

describe("ModulosService.listar", () => {
  it("happy path: where incluye soft-delete y orderBy titulo asc", async () => {
    prisma.modulo.findMany.mockResolvedValue([buildModuloRow()])
    prisma.modulo.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    expect(res.data).toHaveLength(1)
    expect(prisma.modulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        orderBy: { titulo: "asc" },
      }),
    )
  })

  it("filtro estado: ARCHIVADO incluido + soft-delete excluido", async () => {
    prisma.modulo.findMany.mockResolvedValue([])
    prisma.modulo.count.mockResolvedValue(0)

    await service.listar({ page: 1, pageSize: 20, estado: EstadoModulo.ARCHIVADO })
    expect(prisma.modulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, estado: EstadoModulo.ARCHIVADO },
      }),
    )
  })

  it("filtro q sobre titulo case-insensitive", async () => {
    prisma.modulo.findMany.mockResolvedValue([])
    prisma.modulo.count.mockResolvedValue(0)

    await service.listar({ page: 1, pageSize: 20, q: "node" })
    expect(prisma.modulo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, titulo: { contains: "node", mode: "insensitive" } },
      }),
    )
  })

  it("mapper expone solo los campos del SELECT", async () => {
    prisma.modulo.findMany.mockResolvedValue([buildModuloRow()])
    prisma.modulo.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    const primero = res.data[0]
    expect(primero).toBeDefined()
    if (!primero) {
      return
    }
    expect(Object.keys(primero)).toEqual([
      "id",
      "titulo",
      "descripcion",
      "estado",
      "createdAt",
      "updatedAt",
    ])
  })
})

describe("ModulosService.obtenerPorIdOrThrow", () => {
  it("happy path: devuelve modulo mapeado", async () => {
    prisma.modulo.findFirst.mockResolvedValue(buildModuloRow())
    const res = await service.obtenerPorIdOrThrow("mod-1")
    expect(res.titulo).toBe("Fundamentos Node")
    expect(prisma.modulo.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "mod-1", deletedAt: null } }),
    )
  })

  it("soft-deleted: 404 con code MODULO_NO_ENCONTRADO", async () => {
    prisma.modulo.findFirst.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("mod-borrado")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.moduloNoEncontrado)
    }
  })
})
