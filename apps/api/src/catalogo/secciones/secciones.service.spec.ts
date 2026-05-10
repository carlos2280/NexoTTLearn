import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { SeccionesService } from "./secciones.service"

interface MockPrisma {
  seccion: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    seccion: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

const FECHA = new Date("2026-01-01T00:00:00Z")

function buildSeccionRow() {
  return {
    id: "sec-1",
    moduloId: "mod-1",
    titulo: "Que es Node",
    orden: 1,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let service: SeccionesService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new SeccionesService(prisma as unknown as PrismaService)
})

describe("SeccionesService.listar", () => {
  it("happy path: orderBy compuesto moduloId asc + orden asc", async () => {
    prisma.seccion.findMany.mockResolvedValue([buildSeccionRow()])
    prisma.seccion.count.mockResolvedValue(1)

    await service.listar({ page: 1, pageSize: 20 })
    expect(prisma.seccion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ moduloId: "asc" }, { orden: "asc" }],
      }),
    )
  })

  it("filtro moduloId: solo secciones de ese modulo", async () => {
    prisma.seccion.findMany.mockResolvedValue([])
    prisma.seccion.count.mockResolvedValue(0)

    await service.listar({ page: 1, pageSize: 20, moduloId: "mod-7" })
    expect(prisma.seccion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { moduloId: "mod-7" } }),
    )
  })

  it("totalPages: 25 con pageSize 10 -> 3 paginas", async () => {
    prisma.seccion.findMany.mockResolvedValue([buildSeccionRow()])
    prisma.seccion.count.mockResolvedValue(25)

    const res = await service.listar({ page: 1, pageSize: 10 })
    expect(res.meta.totalPages).toBe(3)
  })

  it("mapper expone solo los campos del SELECT", async () => {
    prisma.seccion.findMany.mockResolvedValue([buildSeccionRow()])
    prisma.seccion.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    const primero = res.data[0]
    expect(primero).toBeDefined()
    if (!primero) {
      return
    }
    expect(Object.keys(primero)).toEqual([
      "id",
      "moduloId",
      "titulo",
      "orden",
      "createdAt",
      "updatedAt",
    ])
  })
})

describe("SeccionesService.obtenerPorIdOrThrow", () => {
  it("happy path: devuelve seccion mapeada", async () => {
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    const res = await service.obtenerPorIdOrThrow("sec-1")
    expect(res.titulo).toBe("Que es Node")
  })

  it("inexistente: NotFoundException con code SECCION_NO_ENCONTRADA", async () => {
    prisma.seccion.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.seccionNoEncontrada)
    }
  })
})
