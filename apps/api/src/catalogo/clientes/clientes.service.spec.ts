import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ClientesService } from "./clientes.service"

interface MockPrisma {
  cliente: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    cliente: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

const FECHA = new Date("2026-01-01T00:00:00Z")

function buildClienteRowListado() {
  return {
    id: "cli-1",
    nombre: "ACME Corp",
    activo: true,
    fechaCreacion: FECHA,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

function buildClienteRowDetalle() {
  return {
    ...buildClienteRowListado(),
    datosContacto: { email: "ops@acme.test" } as Record<string, unknown>,
  }
}

let prisma: MockPrisma
let service: ClientesService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new ClientesService(prisma as unknown as PrismaService)
})

describe("ClientesService.listar", () => {
  it("happy path: where con deletedAt=null + orderBy nombre asc", async () => {
    prisma.cliente.findMany.mockResolvedValue([buildClienteRowListado()])
    prisma.cliente.count.mockResolvedValue(1)

    await service.listar({ page: 1, pageSize: 20 })
    expect(prisma.cliente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        orderBy: { nombre: "asc" },
      }),
    )
  })

  it("filtro activo=true + q combinados", async () => {
    prisma.cliente.findMany.mockResolvedValue([])
    prisma.cliente.count.mockResolvedValue(0)

    await service.listar({ page: 1, pageSize: 20, activo: true, q: "acme" })
    expect(prisma.cliente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          activo: true,
          nombre: { contains: "acme", mode: "insensitive" },
        },
      }),
    )
  })

  it("filtro activo=false: incluye inactivos pero excluye soft-deleted", async () => {
    prisma.cliente.findMany.mockResolvedValue([])
    prisma.cliente.count.mockResolvedValue(0)

    await service.listar({ page: 1, pageSize: 20, activo: false })
    expect(prisma.cliente.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null, activo: false } }),
    )
  })

  it("listado NO incluye `datosContacto` (D-CAT-9)", async () => {
    prisma.cliente.findMany.mockResolvedValue([buildClienteRowListado()])
    prisma.cliente.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })
    expect(res.data[0]).not.toHaveProperty("datosContacto")
  })
})

describe("ClientesService.obtenerPorIdOrThrow", () => {
  it("happy path: devuelve detalle con datosContacto", async () => {
    prisma.cliente.findFirst.mockResolvedValue(buildClienteRowDetalle())
    const res = await service.obtenerPorIdOrThrow("cli-1")
    expect(res.datosContacto).toEqual({ email: "ops@acme.test" })
  })

  it("datosContacto null preservado como null en la respuesta", async () => {
    prisma.cliente.findFirst.mockResolvedValue({
      ...buildClienteRowListado(),
      datosContacto: null,
    })
    const res = await service.obtenerPorIdOrThrow("cli-1")
    expect(res.datosContacto).toBeNull()
  })

  it("soft-deleted: 404 con code CLIENTE_NO_ENCONTRADO", async () => {
    prisma.cliente.findFirst.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no")
      throw new Error("se esperaba que lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.clienteNoEncontrado)
    }
  })
})
