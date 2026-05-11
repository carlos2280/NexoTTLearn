import { ConflictException, HttpException, NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { EstadoCurso, EstadoModulo, EstadoSkill } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ModulosService } from "./modulos.service"

interface MockPrisma {
  modulo: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  historicoEstadoModulo: { create: ReturnType<typeof vi.fn> }
  cursoModuloHabilitado: { findMany: ReturnType<typeof vi.fn> }
  cursoSkillExigida: { findMany: ReturnType<typeof vi.fn> }
  cursoAreaExigida: { findMany: ReturnType<typeof vi.fn> }
  skill: { findMany: ReturnType<typeof vi.fn> }
  seccion: { count: ReturnType<typeof vi.fn> }
  seccionSkill: { findMany: ReturnType<typeof vi.fn> }
  bloque: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    modulo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    historicoEstadoModulo: { create: vi.fn() },
    cursoModuloHabilitado: { findMany: vi.fn() },
    cursoSkillExigida: { findMany: vi.fn() },
    cursoAreaExigida: { findMany: vi.fn() },
    skill: { findMany: vi.fn() },
    seccion: { count: vi.fn() },
    seccionSkill: { findMany: vi.fn() },
    bloque: { findMany: vi.fn() },
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

function buildModuloRow(overrides: Partial<{ estado: EstadoModulo; titulo: string }> = {}) {
  return {
    id: MOD_ID,
    titulo: overrides.titulo ?? "Fundamentos Node",
    descripcion: "desc",
    estado: overrides.estado ?? EstadoModulo.ACTIVO,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let audit: ReturnType<typeof buildAudit>
let service: ModulosService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  audit = buildAudit()
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: ModulosService,
        useFactory: (p: PrismaService, a: AuditLogService) => new ModulosService(p, a),
        inject: [PrismaService, AuditLogService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
    ],
  }).compile()
  service = moduleRef.get(ModulosService)
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
})

describe("ModulosService.obtenerPorIdOrThrow", () => {
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

describe("ModulosService.crear", () => {
  it("crea modulo y audita MODULO_CREADO", async () => {
    prisma.modulo.create.mockResolvedValue(buildModuloRow())
    const res = await service.crear({ titulo: "Fundamentos Node" }, ADMIN_ID)
    expect(res.titulo).toBe("Fundamentos Node")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "MODULO_CREADO", recursoTipo: "modulo" }),
    )
  })
})

describe("ModulosService.actualizar", () => {
  it("cambiar titulo sin motivo: 422 MOTIVO_REQUERIDO", async () => {
    prisma.modulo.findFirst.mockResolvedValue(buildModuloRow())
    await expect(
      service.actualizar(MOD_ID, { titulo: "Nuevo" }, undefined, ADMIN_ID),
    ).rejects.toBeInstanceOf(HttpException)
  })

  it("solo descripcion: actualiza sin exigir motivo", async () => {
    prisma.modulo.findFirst.mockResolvedValue(buildModuloRow({ titulo: "Original" }))
    prisma.modulo.update.mockResolvedValue(buildModuloRow({ titulo: "Original" }))
    await service.actualizar(MOD_ID, { descripcion: "nueva" }, undefined, ADMIN_ID)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "MODULO_ACTUALIZADO",
        metadata: expect.objectContaining({ camposCambiados: ["descripcion"] }),
      }),
    )
  })

  it("rechaza editar modulo archivado: 409 CONFLICT_MODULO_ARCHIVADO", async () => {
    prisma.modulo.findFirst.mockResolvedValue(buildModuloRow({ estado: EstadoModulo.ARCHIVADO }))
    await expect(
      service.actualizar(MOD_ID, { titulo: "Nuevo" }, "motivo", ADMIN_ID),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})

describe("ModulosService.archivar", () => {
  it("archiva, persiste historico, audita y devuelve preview vacio cuando no hay cursos activos", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID, estado: EstadoModulo.ACTIVO })
    prisma.modulo.update.mockResolvedValue(buildModuloRow({ estado: EstadoModulo.ARCHIVADO }))
    prisma.cursoModuloHabilitado.findMany.mockResolvedValue([])

    const res = await service.archivar(MOD_ID, "obsoleto", ADMIN_ID)
    expect(res.previewImpacto.cursosActivosAfectados).toHaveLength(0)
    expect(res.previewImpacto.skillsHuerfanas).toHaveLength(0)
    expect(prisma.historicoEstadoModulo.create).toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "MODULO_ARCHIVADO" }),
    )
  })

  it("rechaza si ya archivado: 409 MODULO_YA_ARCHIVADO", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID, estado: EstadoModulo.ARCHIVADO })
    await expect(service.archivar(MOD_ID, "motivo", ADMIN_ID)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it("detecta skill huerfana cuando curso ACTIVO la exige y solo el modulo archivado la cubria", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID, estado: EstadoModulo.ACTIVO })
    prisma.modulo.update.mockResolvedValue(buildModuloRow({ estado: EstadoModulo.ARCHIVADO }))
    prisma.cursoModuloHabilitado.findMany.mockImplementation(
      (args: { where: { moduloId?: string; curso?: { estado?: EstadoCurso } } }) => {
        if (args.where.moduloId === MOD_ID) {
          return Promise.resolve([{ cursoId: "curso-1", curso: { titulo: "Curso X" } }])
        }
        // Modulos restantes del curso, excluyendo el que se archiva.
        return Promise.resolve([])
      },
    )
    prisma.cursoSkillExigida.findMany.mockResolvedValue([
      {
        skill: {
          id: "skill-huerfana",
          etiquetaVisible: "python.fastapi",
          estado: EstadoSkill.ACTIVA,
        },
      },
    ])
    prisma.cursoAreaExigida.findMany.mockResolvedValue([])

    const res = await service.archivar(MOD_ID, "motivo", ADMIN_ID)
    expect(res.previewImpacto.cursosActivosAfectados).toHaveLength(1)
    expect(res.previewImpacto.skillsHuerfanas).toEqual([
      {
        skillId: "skill-huerfana",
        etiquetaVisible: "python.fastapi",
        cursosDondeQuedaHuerfana: ["curso-1"],
      },
    ])
    const acciones = audit.record.mock.calls.map((c) => (c[0] as { accion: string }).accion)
    expect(acciones).toContain("MODULO_ARCHIVADO")
    expect(acciones).toContain("MODULO_HUERFANO_DETECTADO")
  })
})

describe("ModulosService.eliminar", () => {
  it("rechaza si hay cursos activos: 409 MODULO_CON_REFERENCIAS_ACTIVAS", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.cursoModuloHabilitado.findMany.mockResolvedValue([{ cursoId: "c-1" }])
    try {
      await service.eliminar(MOD_ID, "motivo", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictModuloConReferenciasActivas)
    }
  })

  it("rechaza si tiene secciones: 409 MODULO_CON_SECCIONES", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.cursoModuloHabilitado.findMany.mockResolvedValue([])
    prisma.seccion.count.mockResolvedValue(3)
    try {
      await service.eliminar(MOD_ID, "motivo", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictModuloConSecciones)
    }
  })

  it("happy path: soft-delete + audit MODULO_ELIMINADO", async () => {
    prisma.modulo.findFirst.mockResolvedValue({ id: MOD_ID })
    prisma.cursoModuloHabilitado.findMany.mockResolvedValue([])
    prisma.seccion.count.mockResolvedValue(0)
    prisma.modulo.update.mockResolvedValue({ id: MOD_ID })
    await service.eliminar(MOD_ID, "motivo", ADMIN_ID)
    expect(prisma.modulo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "MODULO_ELIMINADO",
        metadata: expect.objectContaining({ motivo: "motivo" }),
      }),
    )
  })
})
