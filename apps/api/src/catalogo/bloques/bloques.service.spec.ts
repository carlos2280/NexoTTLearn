import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { EstadoBloque, EstadoSkill, TipoBloque } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { BloquesService } from "./bloques.service"

interface MockPrisma {
  seccion: { findUnique: ReturnType<typeof vi.fn> }
  bloque: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    aggregate: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  skill: { findUnique: ReturnType<typeof vi.fn> }
  intentoBloque: { updateMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    seccion: { findUnique: vi.fn() },
    bloque: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    skill: { findUnique: vi.fn() },
    intentoBloque: { updateMany: vi.fn() },
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
const SEC_ID = "11111111-1111-1111-1111-111111111111"
const BLO_ID = "22222222-2222-2222-2222-222222222222"
const SKILL_ID = "33333333-3333-3333-3333-333333333333"

function buildDetalleRow(overrides: Partial<{ estado: EstadoBloque; version: number }> = {}) {
  return {
    id: BLO_ID,
    seccionId: SEC_ID,
    orden: 1,
    tipo: TipoBloque.QUIZ,
    esEvaluable: true,
    skillQueMideId: SKILL_ID,
    estado: overrides.estado ?? EstadoBloque.ACTIVO,
    version: overrides.version ?? 1,
    contenido: { preguntas: [] } as Record<string, unknown>,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let audit: ReturnType<typeof buildAudit>
let service: BloquesService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  audit = buildAudit()
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: BloquesService,
        useFactory: (p: PrismaService, a: AuditLogService) => new BloquesService(p, a),
        inject: [PrismaService, AuditLogService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
    ],
  }).compile()
  service = moduleRef.get(BloquesService)
})

describe("BloquesService.listar", () => {
  it("listado NO incluye `contenido` en el SELECT (D-CAT-9)", async () => {
    prisma.bloque.findMany.mockResolvedValue([
      {
        id: BLO_ID,
        seccionId: SEC_ID,
        orden: 1,
        tipo: TipoBloque.PARRAFO,
        esEvaluable: false,
        skillQueMideId: null,
        estado: EstadoBloque.ACTIVO,
        version: 1,
        createdAt: FECHA,
        updatedAt: FECHA,
      },
    ])
    prisma.bloque.count.mockResolvedValue(1)
    await service.listar({ page: 1, pageSize: 20 })
    const llamada = prisma.bloque.findMany.mock.calls[0]?.[0] as { select: Record<string, true> }
    expect(llamada.select).not.toHaveProperty("contenido")
  })
})

describe("BloquesService.obtenerPorIdOrThrow", () => {
  it("inexistente: 404 BLOQUE_NO_ENCONTRADO", async () => {
    prisma.bloque.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerPorIdOrThrow("no")
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.bloqueNoEncontrado)
    }
  })
})

describe("BloquesService.crear", () => {
  it("seccion inexistente: 404 SECCION_NO_ENCONTRADA", async () => {
    prisma.seccion.findUnique.mockResolvedValue(null)
    await expect(
      service.crear(
        SEC_ID,
        { tipo: TipoBloque.PARRAFO, esEvaluable: false, contenido: {} },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("skillQueMide no activa: 409 SKILL_NO_ACTIVA", async () => {
    prisma.seccion.findUnique.mockResolvedValue({ id: SEC_ID })
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ARCHIVADA })
    await expect(
      service.crear(
        SEC_ID,
        {
          tipo: TipoBloque.QUIZ,
          esEvaluable: true,
          skillQueMideId: SKILL_ID,
          contenido: { preguntas: [] },
        },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("orden omitido: max + 1 dentro del tx", async () => {
    prisma.seccion.findUnique.mockResolvedValue({ id: SEC_ID })
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    prisma.bloque.aggregate.mockResolvedValue({ _max: { orden: 4 } })
    prisma.bloque.create.mockResolvedValue(buildDetalleRow())
    const res = await service.crear(
      SEC_ID,
      {
        tipo: TipoBloque.QUIZ,
        esEvaluable: true,
        skillQueMideId: SKILL_ID,
        contenido: { preguntas: [] },
      },
      ADMIN_ID,
    )
    expect(res.id).toBe(BLO_ID)
    expect(prisma.bloque.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 5 }) }),
    )
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ accion: "BLOQUE_CREADO" }))
  })
})

describe("BloquesService.patch", () => {
  it("COSMETICO: solo contenido, no incrementa version, no exige motivo", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 3,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
    })
    prisma.bloque.update.mockResolvedValue(buildDetalleRow({ version: 3 }))
    const res = await service.patch(
      BLO_ID,
      { tipoEdicion: "COSMETICO", contenido: { texto: "nuevo" } },
      undefined,
      ADMIN_ID,
    )
    expect(res.versionAnterior).toBe(3)
    expect(res.versionNueva).toBe(3)
    expect(res.intentosInvalidados).toBe(0)
    expect(prisma.intentoBloque.updateMany).not.toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "BLOQUE_EDITADO_COSMETICO",
        metadata: { tipoEdicion: "COSMETICO" },
      }),
    )
  })

  it("CAMBIA_EVALUACION sin motivo: 422 MOTIVO_REQUERIDO", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
    })
    await expect(
      service.patch(
        BLO_ID,
        { tipoEdicion: "CAMBIA_EVALUACION", contenido: {} },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(HttpException)
  })

  it("CAMBIA_EVALUACION con motivo: incrementa version e invalida intentos (0 hoy)", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 5,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
    })
    prisma.bloque.update.mockResolvedValue(buildDetalleRow({ version: 6 }))
    prisma.intentoBloque.updateMany.mockResolvedValue({ count: 0 })
    const res = await service.patch(
      BLO_ID,
      { tipoEdicion: "CAMBIA_EVALUACION", contenido: {} },
      "ajuste de rubrica",
      ADMIN_ID,
    )
    expect(res.versionAnterior).toBe(5)
    expect(res.versionNueva).toBe(6)
    expect(prisma.intentoBloque.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ bloqueId: BLO_ID, versionBloque: { lt: 6 } }),
      }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "BLOQUE_EDITADO_EVALUACION",
        metadata: expect.objectContaining({
          tipoEdicion: "CAMBIA_EVALUACION",
          motivo: "ajuste de rubrica",
          versionAnterior: 5,
          versionNueva: 6,
        }),
      }),
    )
  })

  it("CAMBIA_EVALUACION con esEvaluable=true sin skill: 400 BLOQUE_SKILL_OBLIGATORIA_EVALUABLE", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: false,
      skillQueMideId: null,
    })
    await expect(
      service.patch(
        BLO_ID,
        { tipoEdicion: "CAMBIA_EVALUACION", contenido: {}, esEvaluable: true },
        "motivo",
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("bloque ya eliminado: 409 BLOQUE_YA_ELIMINADO", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ELIMINADO,
      esEvaluable: false,
      skillQueMideId: null,
    })
    await expect(
      service.patch(BLO_ID, { tipoEdicion: "COSMETICO", contenido: {} }, undefined, ADMIN_ID),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})

describe("BloquesService.eliminarSoft", () => {
  it("soft-delete: cambia estado a ELIMINADO y audita", async () => {
    prisma.bloque.findUnique.mockResolvedValue({ id: BLO_ID, estado: EstadoBloque.ACTIVO })
    prisma.bloque.update.mockResolvedValue({ id: BLO_ID })
    const res = await service.eliminarSoft(BLO_ID, "obsoleto", ADMIN_ID)
    expect(prisma.bloque.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoBloque.ELIMINADO } }),
    )
    expect(res.previewImpacto.colaboradoresAfectados).toEqual([])
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "BLOQUE_ELIMINADO_SOFT",
        metadata: expect.objectContaining({ motivo: "obsoleto" }),
      }),
    )
  })

  it("ya eliminado: 409 BLOQUE_YA_ELIMINADO", async () => {
    prisma.bloque.findUnique.mockResolvedValue({ id: BLO_ID, estado: EstadoBloque.ELIMINADO })
    await expect(service.eliminarSoft(BLO_ID, "x", ADMIN_ID)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })
})
