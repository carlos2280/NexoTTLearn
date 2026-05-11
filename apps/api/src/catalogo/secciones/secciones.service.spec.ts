import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { EstadoSkill } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { SeccionesService } from "./secciones.service"

interface MockPrisma {
  modulo: { findFirst: ReturnType<typeof vi.fn> }
  seccion: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    aggregate: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  seccionSkill: {
    findMany: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  skill: { findMany: ReturnType<typeof vi.fn> }
  bloque: { count: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    modulo: { findFirst: vi.fn() },
    seccion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    seccionSkill: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    skill: { findMany: vi.fn() },
    bloque: { count: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(
    (arg: readonly Promise<unknown>[] | ((tx: MockPrisma) => Promise<unknown>)) => {
      if (typeof arg === "function") {
        return arg(mock)
      }
      return Promise.all(arg)
    },
  )
  return mock
}

function buildAudit(): { record: ReturnType<typeof vi.fn> } {
  return { record: vi.fn().mockResolvedValue(undefined) }
}

const FECHA = new Date("2026-01-01T00:00:00Z")
const ADMIN_ID = "00000000-0000-0000-0000-00000000aaaa"
const MOD_ID = "11111111-1111-1111-1111-111111111111"
const SEC_ID = "22222222-2222-2222-2222-222222222222"
const SKILL_ID = "33333333-3333-3333-3333-333333333333"

function buildSeccionRow(overrides: Partial<{ id: string; orden: number; titulo: string }> = {}) {
  return {
    id: overrides.id ?? SEC_ID,
    moduloId: MOD_ID,
    titulo: overrides.titulo ?? "Que es Node",
    orden: overrides.orden ?? 1,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let audit: ReturnType<typeof buildAudit>
let service: SeccionesService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  audit = buildAudit()
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: SeccionesService,
        useFactory: (p: PrismaService, a: AuditLogService) => new SeccionesService(p, a),
        inject: [PrismaService, AuditLogService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
    ],
  }).compile()
  service = moduleRef.get(SeccionesService)
})

describe("SeccionesService.listar", () => {
  it("orderBy compuesto moduloId asc + orden asc", async () => {
    prisma.seccion.findMany.mockResolvedValue([buildSeccionRow()])
    prisma.seccion.count.mockResolvedValue(1)
    await service.listar({ page: 1, pageSize: 20 })
    expect(prisma.seccion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ moduloId: "asc" }, { orden: "asc" }] }),
    )
  })
})

describe("SeccionesService.obtenerPorIdOrThrow", () => {
  it("inexistente: 404 SECCION_NO_ENCONTRADA", async () => {
    prisma.seccion.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no")
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.seccionNoEncontrada)
    }
  })
})

describe("SeccionesService.crear", () => {
  it("modulo inexistente: 404 MODULO_NO_ENCONTRADO", async () => {
    prisma.modulo.findFirst.mockResolvedValue(null)
    await expect(service.crear(MOD_ID, { titulo: "X" }, ADMIN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("orden omitido: usa max + 1 dentro del tx", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.seccion.aggregate.mockResolvedValue({ _max: { orden: 3 } })
    prisma.seccion.create.mockResolvedValue(buildSeccionRow({ orden: 4 }))
    const res = await service.crear(MOD_ID, { titulo: "Nueva" }, ADMIN_ID)
    expect(res.orden).toBe(4)
    expect(prisma.seccion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 4 }) }),
    )
  })

  it("orden duplicado: 409 SECCION_ORDEN_DUPLICADO", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.seccion.findFirst.mockResolvedValue({ id: "existente" })
    try {
      await service.crear(MOD_ID, { titulo: "X", orden: 2 }, ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.seccionOrdenDuplicado)
    }
  })

  it("skill no activa: 409 SKILL_NO_ACTIVA", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_ID, estado: EstadoSkill.ARCHIVADA }])
    await expect(
      service.crear(MOD_ID, { titulo: "X", skillIds: [SKILL_ID] }, ADMIN_ID),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("happy con skillIds: createMany de seccion_skill + audit SECCION_CREADA", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_ID, estado: EstadoSkill.ACTIVA }])
    prisma.seccion.aggregate.mockResolvedValue({ _max: { orden: 0 } })
    prisma.seccion.create.mockResolvedValue(buildSeccionRow({ orden: 1 }))
    prisma.seccionSkill.createMany.mockResolvedValue({ count: 1 })
    await service.crear(MOD_ID, { titulo: "X", skillIds: [SKILL_ID] }, ADMIN_ID)
    expect(prisma.seccionSkill.createMany).toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ accion: "SECCION_CREADA" }))
  })
})

describe("SeccionesService.actualizar", () => {
  it("releer skills en tx detecta race: si una skill se archiva durante la transaccion, 409", async () => {
    prisma.seccion.findFirst.mockResolvedValue(buildSeccionRow())
    // Dentro del tx: la validacion de skills lanza por archivada.
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_ID, estado: EstadoSkill.ARCHIVADA }])
    await expect(
      service.actualizar(MOD_ID, SEC_ID, { skillIds: [SKILL_ID] }, ADMIN_ID),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.skillNoActiva } })
    expect(prisma.seccion.update).not.toHaveBeenCalled()
    expect(prisma.seccionSkill.createMany).not.toHaveBeenCalled()
    expect(prisma.seccionSkill.deleteMany).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })
})

describe("SeccionesService.reordenar", () => {
  it("rechaza si el set de seccionId no coincide: 400 SECCION_ORDEN_INVALIDO", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.seccion.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }])
    await expect(
      service.reordenar(
        MOD_ID,
        { orden: [{ seccionId: "00000000-0000-0000-0000-00000000000a", orden: 1 }] },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("happy: bumpea con offset y luego asigna orden final dentro del tx", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.seccion.findMany.mockResolvedValue([
      { id: "11111111-1111-1111-1111-aaaaaaaaaaaa" },
      { id: "22222222-2222-2222-2222-bbbbbbbbbbbb" },
    ])
    prisma.seccion.update.mockResolvedValue({ id: "x" })
    prisma.seccion.updateMany.mockResolvedValue({ count: 2 })
    await service.reordenar(
      MOD_ID,
      {
        orden: [
          { seccionId: "11111111-1111-1111-1111-aaaaaaaaaaaa", orden: 2 },
          { seccionId: "22222222-2222-2222-2222-bbbbbbbbbbbb", orden: 1 },
        ],
      },
      ADMIN_ID,
    )
    // Paso 1: un solo updateMany con increment. Paso 2: N updates con orden final.
    expect(prisma.seccion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { moduloId: MOD_ID },
        data: { orden: { increment: 1_000_000 } },
      }),
    )
    expect(prisma.seccion.update).toHaveBeenCalledTimes(2)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "SECCION_REORDENADA" }),
    )
  })
})

describe("SeccionesService.eliminar", () => {
  it("con bloques activos: 409 SECCION_CON_BLOQUES_ACTIVOS", async () => {
    prisma.seccion.findFirst.mockResolvedValue({ id: SEC_ID })
    prisma.bloque.count.mockResolvedValue(2)
    try {
      await service.eliminar(MOD_ID, SEC_ID, "motivo", ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictSeccionConBloquesActivos)
    }
  })

  it("happy: hard-delete + audit SECCION_ELIMINADA con motivo en metadata", async () => {
    prisma.seccion.findFirst.mockResolvedValue({ id: SEC_ID })
    prisma.bloque.count.mockResolvedValue(0)
    prisma.bloque.deleteMany.mockResolvedValue({ count: 0 })
    prisma.seccion.delete.mockResolvedValue({ id: SEC_ID })
    await service.eliminar(MOD_ID, SEC_ID, "limpiar", ADMIN_ID)
    expect(prisma.seccion.delete).toHaveBeenCalledWith({ where: { id: SEC_ID } })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "SECCION_ELIMINADA",
        metadata: expect.objectContaining({ motivo: "limpiar" }),
      }),
    )
  })
})
