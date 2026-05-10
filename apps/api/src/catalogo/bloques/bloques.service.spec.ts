import { NotFoundException } from "@nestjs/common"
import { EstadoBloque, TipoBloque } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { BloquesService } from "./bloques.service"

interface MockPrisma {
  bloque: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    bloque: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

const FECHA = new Date("2026-01-01T00:00:00Z")

function buildBloqueRowListado() {
  return {
    id: "blo-1",
    seccionId: "sec-1",
    orden: 1,
    tipo: TipoBloque.PARRAFO,
    esEvaluable: false,
    skillQueMideId: null,
    estado: EstadoBloque.ACTIVO,
    version: 1,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

function buildBloqueRowDetalle() {
  return {
    ...buildBloqueRowListado(),
    contenido: { texto: "placeholder" } as Record<string, unknown>,
  }
}

let prisma: MockPrisma
let service: BloquesService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new BloquesService(prisma as unknown as PrismaService)
})

describe("BloquesService.listar", () => {
  it("happy path: orderBy compuesto seccionId asc + orden asc", async () => {
    prisma.bloque.findMany.mockResolvedValue([buildBloqueRowListado()])
    prisma.bloque.count.mockResolvedValue(1)

    await service.listar({ page: 1, pageSize: 20 })
    expect(prisma.bloque.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: [{ seccionId: "asc" }, { orden: "asc" }],
      }),
    )
  })

  it("filtros seccionId + tipo + estado combinados", async () => {
    prisma.bloque.findMany.mockResolvedValue([])
    prisma.bloque.count.mockResolvedValue(0)

    await service.listar({
      page: 1,
      pageSize: 20,
      seccionId: "sec-1",
      tipo: TipoBloque.QUIZ,
      estado: EstadoBloque.ELIMINADO,
    })
    expect(prisma.bloque.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { seccionId: "sec-1", tipo: TipoBloque.QUIZ, estado: EstadoBloque.ELIMINADO },
      }),
    )
  })

  it("listado NO incluye `contenido` en el SELECT (D-CAT-9)", async () => {
    prisma.bloque.findMany.mockResolvedValue([buildBloqueRowListado()])
    prisma.bloque.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    expect(res.data[0]).not.toHaveProperty("contenido")
    const llamada = prisma.bloque.findMany.mock.calls[0]?.[0] as { select: Record<string, true> }
    expect(llamada.select).not.toHaveProperty("contenido")
  })

  it("paginacion meta calculado correctamente", async () => {
    prisma.bloque.findMany.mockResolvedValue([buildBloqueRowListado()])
    prisma.bloque.count.mockResolvedValue(7)

    const res = await service.listar({ page: 1, pageSize: 3 })
    expect(res.meta).toEqual({ page: 1, pageSize: 3, total: 7, totalPages: 3 })
  })
})

describe("BloquesService.obtenerPorIdOrThrow", () => {
  it("happy path: devuelve detalle CON `contenido`", async () => {
    prisma.bloque.findUnique.mockResolvedValue(buildBloqueRowDetalle())
    const res = await service.obtenerPorIdOrThrow("blo-1")
    expect(res.contenido).toEqual({ texto: "placeholder" })
  })

  it("inexistente: NotFoundException con code BLOQUE_NO_ENCONTRADO", async () => {
    prisma.bloque.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.bloqueNoEncontrado)
    }
  })
})
