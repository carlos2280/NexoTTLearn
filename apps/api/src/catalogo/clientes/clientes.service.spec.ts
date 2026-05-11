import { ConflictException, HttpException, NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ClientesService } from "./clientes.service"

interface MockPrisma {
  cliente: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  curso: { count: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    cliente: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    curso: { count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

function buildAudit(): { record: ReturnType<typeof vi.fn> } {
  return { record: vi.fn().mockResolvedValue(undefined) }
}

const FECHA = new Date("2026-01-01T00:00:00Z")
const ADMIN_ID = "00000000-0000-0000-0000-00000000aaaa"
const CLI_ID = "11111111-1111-1111-1111-111111111111"

function buildDetalleRow(overrides: Partial<{ nombre: string; activo: boolean }> = {}) {
  return {
    id: CLI_ID,
    nombre: overrides.nombre ?? "ACME Corp",
    activo: overrides.activo ?? true,
    fechaCreacion: FECHA,
    createdAt: FECHA,
    updatedAt: FECHA,
    datosContacto: { email: "ops@acme.test" } as Record<string, unknown>,
  }
}

let prisma: MockPrisma
let audit: ReturnType<typeof buildAudit>
let service: ClientesService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  audit = buildAudit()
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: ClientesService,
        useFactory: (p: PrismaService, a: AuditLogService) => new ClientesService(p, a),
        inject: [PrismaService, AuditLogService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
    ],
  }).compile()
  service = moduleRef.get(ClientesService)
})

describe("ClientesService.listar", () => {
  it("listado NO incluye datosContacto", async () => {
    prisma.cliente.findMany.mockResolvedValue([
      {
        id: CLI_ID,
        nombre: "ACME",
        activo: true,
        fechaCreacion: FECHA,
        createdAt: FECHA,
        updatedAt: FECHA,
      },
    ])
    prisma.cliente.count.mockResolvedValue(1)
    const res = await service.listar({ page: 1, pageSize: 20 })
    expect(res.data[0]).not.toHaveProperty("datosContacto")
  })
})

describe("ClientesService.obtenerPorIdOrThrow", () => {
  it("inexistente: 404 CLIENTE_NO_ENCONTRADO", async () => {
    prisma.cliente.findFirst.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no")
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.clienteNoEncontrado)
    }
  })
})

describe("ClientesService.crear", () => {
  it("happy: crea y audita CLIENTE_CREADO", async () => {
    prisma.cliente.create.mockResolvedValue(buildDetalleRow())
    const res = await service.crear({ nombre: "ACME Corp" }, ADMIN_ID)
    expect(res.nombre).toBe("ACME Corp")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "CLIENTE_CREADO", recursoTipo: "cliente" }),
    )
  })

  it("nombre duplicado (P2002): 409 CONFLICT_CLIENTE_NOMBRE_DUPLICADO", async () => {
    prisma.cliente.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "x",
        meta: { target: ["nombre"] },
      }),
    )
    try {
      await service.crear({ nombre: "ACME" }, ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictClienteNombreDuplicado)
    }
  })
})

describe("ClientesService.actualizar", () => {
  it("solo datosContacto: no exige motivo", async () => {
    prisma.cliente.findFirst.mockResolvedValue(buildDetalleRow())
    prisma.cliente.update.mockResolvedValue(buildDetalleRow())
    const res = await service.actualizar(CLI_ID, { datosContacto: { x: 1 } }, undefined, ADMIN_ID)
    expect(res.nombre).toBe("ACME Corp")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "CLIENTE_ACTUALIZADO",
        metadata: expect.objectContaining({ camposCambiados: ["datosContacto"] }),
      }),
    )
  })

  it("cambia nombre sin motivo: 422 MOTIVO_REQUERIDO", async () => {
    prisma.cliente.findFirst.mockResolvedValue(buildDetalleRow({ nombre: "Original" }))
    await expect(
      service.actualizar(CLI_ID, { nombre: "Nuevo" }, undefined, ADMIN_ID),
    ).rejects.toBeInstanceOf(HttpException)
  })

  it("cambia activo con motivo: persiste motivo en metadata", async () => {
    prisma.cliente.findFirst.mockResolvedValue(buildDetalleRow({ activo: true }))
    prisma.cliente.update.mockResolvedValue(buildDetalleRow({ activo: false }))
    await service.actualizar(CLI_ID, { activo: false }, "off-boarding", ADMIN_ID)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ motivo: "off-boarding" }),
      }),
    )
  })
})

describe("ClientesService.eliminar", () => {
  it("con cursos: 409 CONFLICT_CLIENTE_CON_CURSOS", async () => {
    prisma.cliente.findFirst.mockResolvedValue({ id: CLI_ID })
    prisma.curso.count.mockResolvedValue(5)
    try {
      await service.eliminar(CLI_ID, "motivo", ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictClienteConCursos)
    }
  })

  it("happy: soft-delete con deletedAt + activo=false + audit", async () => {
    prisma.cliente.findFirst.mockResolvedValue({ id: CLI_ID })
    prisma.curso.count.mockResolvedValue(0)
    prisma.cliente.update.mockResolvedValue({ id: CLI_ID })
    await service.eliminar(CLI_ID, "limpieza", ADMIN_ID)
    expect(prisma.cliente.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date), activo: false }),
      }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "CLIENTE_ELIMINADO",
        metadata: expect.objectContaining({ motivo: "limpieza" }),
      }),
    )
  })
})
