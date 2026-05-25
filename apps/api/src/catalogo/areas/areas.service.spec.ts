import { ConflictException, NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { AreasService } from "./areas.service"

interface MockPrisma {
  area: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  skill: {
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
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    skill: { count: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (ops: readonly Promise<unknown>[]) => Promise.all(ops))
  return mock
}

function buildAuditMock(): { record: ReturnType<typeof vi.fn> } {
  return { record: vi.fn().mockResolvedValue(undefined) }
}

const FECHA = new Date("2026-01-01T00:00:00Z")
const ADMIN_ID = "00000000-0000-0000-0000-00000000aaaa"

function buildAreaRow(
  overrides: Partial<{
    id: string
    nombre: string
    codigo: string
    descripcion: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? "area-1",
    nombre: overrides.nombre ?? "Backend",
    codigo: overrides.codigo ?? "backend",
    descripcion: overrides.descripcion ?? "desc",
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let audit: ReturnType<typeof buildAuditMock>
let service: AreasService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  audit = buildAuditMock()
  // Nota: vitest + esbuild no emite `design:paramtypes`, asi que la resolucion
  // por constructor de NestJS no funciona. Usamos `useFactory` con `inject`
  // explicito para mantener el contenedor de DI real (Test.createTestingModule)
  // sin depender de metadata de decoradores.
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: AreasService,
        useFactory: (p: PrismaService, a: AuditLogService) => new AreasService(p, a),
        inject: [PrismaService, AuditLogService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
    ],
  }).compile()
  service = moduleRef.get(AreasService)
})

describe("AreasService.listar", () => {
  it("happy path: pagina por defecto devuelve datos mapeados y meta correcta", async () => {
    prisma.area.findMany.mockResolvedValue([buildAreaRow()])
    prisma.area.count.mockResolvedValue(1)

    const res = await service.listar({ page: 1, pageSize: 20 })

    expect(res.data).toHaveLength(1)
    expect(res.data[0]?.nombre).toBe("Backend")
    expect(res.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 })
  })

  it("filtro q aplica contains case-insensitive", async () => {
    prisma.area.findMany.mockResolvedValue([])
    prisma.area.count.mockResolvedValue(0)
    await service.listar({ page: 1, pageSize: 20, q: "back" })
    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { nombre: { contains: "back", mode: "insensitive" } } }),
    )
  })
})

describe("AreasService.obtenerPorIdOrThrow", () => {
  it("inexistente: lanza NotFoundException con code AREA_NO_ENCONTRADA", async () => {
    prisma.area.findUnique.mockResolvedValue(null)
    await expect(
      service.obtenerPorIdOrThrow("00000000-0000-0000-0000-000000000abc"),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("AreasService.crear", () => {
  it("crea, mapea y emite audit log AREA_CREADA", async () => {
    prisma.area.create.mockResolvedValue(buildAreaRow({ id: "nuevo" }))
    const res = await service.crear(
      { nombre: "Backend", codigo: "backend", descripcion: "desc" },
      ADMIN_ID,
    )
    expect(res.id).toBe("nuevo")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "AREA_CREADA", recursoTipo: "area", recursoId: "nuevo" }),
    )
  })

  it("nombre duplicado -> 409 CONFLICT_AREA_NOMBRE_DUPLICADO", async () => {
    prisma.area.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "x",
        meta: { target: ["nombre"] },
      }),
    )
    try {
      await service.crear({ nombre: "Backend", codigo: "backend" }, ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictAreaNombreDuplicado)
    }
  })
})

describe("AreasService.actualizar", () => {
  it("happy path: actualiza, mapea y emite audit AREA_ACTUALIZADA", async () => {
    prisma.area.findUnique.mockResolvedValue(buildAreaRow())
    prisma.area.update.mockResolvedValue(buildAreaRow({ nombre: "Backend 2" }))
    const res = await service.actualizar("area-1", { nombre: "Backend 2" }, ADMIN_ID)
    expect(res.nombre).toBe("Backend 2")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "AREA_ACTUALIZADA", recursoId: "area-1" }),
    )
  })

  it("inexistente: 404 AREA_NO_ENCONTRADA", async () => {
    prisma.area.findUnique.mockResolvedValue(null)
    await expect(service.actualizar("xx", { nombre: "x" }, ADMIN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(audit.record).not.toHaveBeenCalled()
  })

  it("nombre duplicado en update -> 409", async () => {
    prisma.area.findUnique.mockResolvedValue(buildAreaRow())
    prisma.area.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "x",
        meta: { target: ["nombre"] },
      }),
    )
    await expect(service.actualizar("area-1", { nombre: "X" }, ADMIN_ID)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })
})

describe("AreasService.eliminar", () => {
  it("inexistente: 404", async () => {
    prisma.area.findUnique.mockResolvedValue(null)
    await expect(service.eliminar("xx", ADMIN_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("con skills asociadas: 409 CONFLICT_AREA_CON_SKILLS con details.skillsCount", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: "area-1" })
    prisma.skill.count.mockResolvedValue(3)
    try {
      await service.eliminar("area-1", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as {
        code: string
        details: { skillsCount: number }
      }
      expect(r.code).toBe(apiErrorCodes.conflictAreaConSkills)
      expect(r.details.skillsCount).toBe(3)
    }
    expect(prisma.area.delete).not.toHaveBeenCalled()
  })

  it("sin skills: elimina y emite audit AREA_ELIMINADA", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: "area-1" })
    prisma.skill.count.mockResolvedValue(0)
    prisma.area.delete.mockResolvedValue(undefined)
    await service.eliminar("area-1", ADMIN_ID)
    expect(prisma.area.delete).toHaveBeenCalledWith({ where: { id: "area-1" } })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "AREA_ELIMINADA", recursoId: "area-1" }),
    )
  })
})
