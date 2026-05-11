import { ConflictException, NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { EstadoSkill } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../../common/audit/audit-log.service"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { SkillsService } from "./skills.service"

interface MockPrisma {
  skill: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  area: { findUnique: ReturnType<typeof vi.fn> }
  historicoRenombradoSkill: {
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  historicoCambiosAreaSkill: { findMany: ReturnType<typeof vi.fn> }
  seccionSkill: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  cursoSkillExigida: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  cursoAreaExigida: { findMany: ReturnType<typeof vi.fn> }
  bloque: { count: ReturnType<typeof vi.fn> }
  transversalSkill: { count: ReturnType<typeof vi.fn> }
  notaSkill: { count: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    skill: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    area: { findUnique: vi.fn() },
    historicoRenombradoSkill: { create: vi.fn(), findMany: vi.fn() },
    historicoCambiosAreaSkill: { findMany: vi.fn() },
    seccionSkill: { findMany: vi.fn(), count: vi.fn() },
    cursoSkillExigida: { findMany: vi.fn(), count: vi.fn() },
    cursoAreaExigida: { findMany: vi.fn() },
    bloque: { count: vi.fn() },
    transversalSkill: { count: vi.fn() },
    notaSkill: { count: vi.fn() },
    $transaction: vi.fn(),
  }
  // Array form: ejecuta operaciones en paralelo (las queries ya son promises).
  // Callback form: ejecuta el callback con `tx` siendo el propio prisma mock.
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
const AREA_ID = "11111111-1111-1111-1111-111111111111"
const SKILL_ID = "22222222-2222-2222-2222-222222222222"

function buildSkillRow(
  overrides: Partial<{ id: string; etiquetaVisible: string; estado: EstadoSkill }> = {},
) {
  return {
    id: overrides.id ?? SKILL_ID,
    etiquetaVisible: overrides.etiquetaVisible ?? "python.fastapi",
    areaId: AREA_ID,
    estado: overrides.estado ?? EstadoSkill.ACTIVA,
    createdAt: FECHA,
    updatedAt: FECHA,
  }
}

let prisma: MockPrisma
let audit: ReturnType<typeof buildAudit>
let service: SkillsService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  audit = buildAudit()
  // Vitest + esbuild no emite `design:paramtypes`, asi que usamos `useFactory`
  // con `inject` explicito para mantener el contenedor de DI real sin depender
  // de metadata de decoradores.
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: SkillsService,
        useFactory: (p: PrismaService, a: AuditLogService) => new SkillsService(p, a),
        inject: [PrismaService, AuditLogService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: audit },
    ],
  }).compile()
  service = moduleRef.get(SkillsService)
})

describe("SkillsService.crear", () => {
  it("OK sin candidatas: crea y registra audit SKILL_CREADA", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    prisma.skill.findFirst.mockResolvedValue(null)
    prisma.skill.findMany.mockResolvedValue([])
    prisma.skill.create.mockResolvedValue(buildSkillRow())

    const res = await service.crear(
      { etiquetaVisible: "python.fastapi", areaId: AREA_ID },
      { forzarCreacion: false },
      ADMIN_ID,
    )
    expect(res.etiquetaVisible).toBe("python.fastapi")
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "SKILL_CREADA", recursoTipo: "skill" }),
    )
  })

  it("area inexistente: 404 AREA_NO_ENCONTRADA", async () => {
    prisma.area.findUnique.mockResolvedValue(null)
    await expect(
      service.crear({ etiquetaVisible: "x", areaId: AREA_ID }, { forzarCreacion: false }, ADMIN_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("igualdad exacta case-insensitive: 409 NOMBRE_DUPLICADO aun con forzarCreacion=true", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    prisma.skill.findFirst.mockResolvedValue({ id: "otra" })
    try {
      await service.crear(
        { etiquetaVisible: "Python.FastAPI", areaId: AREA_ID },
        { forzarCreacion: true },
        ADMIN_ID,
      )
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictSkillNombreDuplicado)
    }
    expect(prisma.skill.create).not.toHaveBeenCalled()
  })

  it("hay candidatas y NO forzar: 409 CONFLICT_SKILL_DUPLICADA con details.candidatas", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    prisma.skill.findFirst.mockResolvedValue(null)
    prisma.skill.findMany
      .mockResolvedValueOnce([
        {
          id: "cand-1",
          etiquetaVisible: "python.fastapi",
          areaId: AREA_ID,
          area: { nombre: "Backend" },
        },
      ])
      .mockResolvedValueOnce([])
    prisma.cursoSkillExigida.findMany.mockResolvedValue([{ cursoId: "c1" }])
    prisma.cursoAreaExigida.findMany.mockResolvedValue([{ cursoId: "c1" }, { cursoId: "c2" }])

    try {
      await service.crear(
        { etiquetaVisible: "python.fast_api", areaId: AREA_ID },
        { forzarCreacion: false },
        ADMIN_ID,
      )
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as {
        code: string
        details: { candidatas: readonly { id: string; cursosQueLaUsan: number }[] }
      }
      expect(r.code).toBe(apiErrorCodes.conflictSkillDuplicada)
      expect(r.details.candidatas[0]?.id).toBe("cand-1")
      expect(r.details.candidatas[0]?.cursosQueLaUsan).toBe(2)
    }
  })

  it("hay candidatas pero forzarCreacion=true: crea igual y audit registra contexto", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    prisma.skill.findFirst.mockResolvedValue(null)
    prisma.skill.create.mockResolvedValue(buildSkillRow({ id: "nueva" }))

    const res = await service.crear(
      { etiquetaVisible: "python.fast_api", areaId: AREA_ID },
      { forzarCreacion: true },
      ADMIN_ID,
    )
    expect(res.id).toBe("nueva")
    expect(prisma.skill.findMany).not.toHaveBeenCalled()
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ accion: "SKILL_CREADA" }))
  })

  it("wizard propaga error de DB al contar cursos (no devuelve 0 enganoso)", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    prisma.skill.findFirst.mockResolvedValue(null)
    prisma.skill.findMany
      .mockResolvedValueOnce([
        {
          id: "cand-1",
          etiquetaVisible: "python.fastapi",
          areaId: AREA_ID,
          area: { nombre: "Backend" },
        },
      ])
      .mockResolvedValueOnce([])
    prisma.cursoSkillExigida.findMany.mockRejectedValue(new Error("DB down"))
    prisma.cursoAreaExigida.findMany.mockResolvedValue([])

    await expect(
      service.crear(
        { etiquetaVisible: "python.fast_api", areaId: AREA_ID },
        { forzarCreacion: false },
        ADMIN_ID,
      ),
    ).rejects.toThrow("DB down")
    expect(prisma.skill.create).not.toHaveBeenCalled()
  })

  it("wizard con 'python.fast_api' propone 'python.fastapi' (caso doc §6.5)", async () => {
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    prisma.skill.findFirst.mockResolvedValue(null)
    prisma.skill.findMany
      .mockResolvedValueOnce([
        {
          id: "skill-fastapi",
          etiquetaVisible: "python.fastapi",
          areaId: AREA_ID,
          area: { nombre: "Backend" },
        },
      ])
      .mockResolvedValueOnce([])
    prisma.cursoSkillExigida.findMany.mockResolvedValue([])
    prisma.cursoAreaExigida.findMany.mockResolvedValue([])

    await expect(
      service.crear(
        { etiquetaVisible: "python.fast_api", areaId: AREA_ID },
        { forzarCreacion: false },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(ConflictException)

    expect(prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estado: EstadoSkill.ACTIVA,
          etiquetaVisible: { startsWith: "python.", mode: "insensitive" },
        }),
      }),
    )
  })
})

describe("SkillsService.renombrar", () => {
  it("happy path: actualiza, inserta historico y audita SKILL_RENOMBRADA", async () => {
    prisma.skill.findUnique.mockResolvedValue(buildSkillRow())
    prisma.skill.update.mockResolvedValue(buildSkillRow({ etiquetaVisible: "python.fastapi-v2" }))

    const res = await service.renombrar(
      SKILL_ID,
      { etiquetaVisible: "python.fastapi-v2" },
      "Correccion ortografica",
      ADMIN_ID,
    )
    expect(res.etiquetaVisible).toBe("python.fastapi-v2")
    expect(prisma.historicoRenombradoSkill.create).toHaveBeenCalledWith({
      data: {
        skillId: SKILL_ID,
        etiquetaAnterior: "python.fastapi",
        etiquetaNueva: "python.fastapi-v2",
        autorUsuarioId: ADMIN_ID,
      },
    })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "SKILL_RENOMBRADA", recursoId: SKILL_ID }),
    )
  })

  it("inexistente: 404 SKILL_NO_ENCONTRADA", async () => {
    prisma.skill.findUnique.mockResolvedValue(null)
    await expect(
      service.renombrar(SKILL_ID, { etiquetaVisible: "x" }, "m", ADMIN_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("misma etiqueta: no actualiza ni audita", async () => {
    prisma.skill.findUnique.mockResolvedValue(buildSkillRow())
    const res = await service.renombrar(
      SKILL_ID,
      { etiquetaVisible: "python.fastapi" },
      "m",
      ADMIN_ID,
    )
    expect(res.etiquetaVisible).toBe("python.fastapi")
    expect(prisma.skill.update).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })
})

describe("SkillsService.archivar / desarchivar", () => {
  it("archivar OK + audit", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    prisma.skill.update.mockResolvedValue({ id: SKILL_ID })
    await service.archivar(SKILL_ID, "obsoleta", ADMIN_ID)
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoSkill.ARCHIVADA } }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "SKILL_ARCHIVADA" }),
    )
  })

  it("archivar ya archivada: 409 CONFLICT_SKILL_YA_ARCHIVADA", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ARCHIVADA })
    try {
      await service.archivar(SKILL_ID, "m", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictSkillYaArchivada)
    }
  })

  it("desarchivar OK + audit", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ARCHIVADA })
    prisma.skill.update.mockResolvedValue({ id: SKILL_ID })
    await service.desarchivar(SKILL_ID, ADMIN_ID)
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "SKILL_DESARCHIVADA" }),
    )
  })

  it("desarchivar ya activa: 409 CONFLICT_SKILL_YA_ACTIVA", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    try {
      await service.desarchivar(SKILL_ID, ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflictSkillYaActiva)
    }
  })
})

describe("SkillsService.eliminar", () => {
  it("sin referencias: hard delete + audit SKILL_ELIMINADA", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, etiquetaVisible: "vieja" })
    prisma.seccionSkill.count.mockResolvedValue(0)
    prisma.cursoSkillExigida.count.mockResolvedValue(0)
    prisma.bloque.count.mockResolvedValue(0)
    prisma.transversalSkill.count.mockResolvedValue(0)
    prisma.notaSkill.count.mockResolvedValue(0)
    await service.eliminar(SKILL_ID, "obsoleta", ADMIN_ID)
    expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: SKILL_ID } })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ accion: "SKILL_ELIMINADA" }),
    )
  })

  it("con referencias: 409 CONFLICT_SKILL_CON_REFERENCIAS con details.referencias", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, etiquetaVisible: "x" })
    prisma.seccionSkill.count.mockResolvedValue(2)
    prisma.cursoSkillExigida.count.mockResolvedValue(1)
    prisma.bloque.count.mockResolvedValue(0)
    prisma.transversalSkill.count.mockResolvedValue(0)
    prisma.notaSkill.count.mockResolvedValue(0)
    try {
      await service.eliminar(SKILL_ID, "x", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as {
        code: string
        details: { referencias: { secciones: number; cursos: number } }
      }
      expect(r.code).toBe(apiErrorCodes.conflictSkillConReferencias)
      expect(r.details.referencias.secciones).toBe(2)
      expect(r.details.referencias.cursos).toBe(1)
    }
    expect(prisma.skill.delete).not.toHaveBeenCalled()
  })
})

describe("SkillsService.historico / cobertura", () => {
  it("historico inexistente: 404", async () => {
    prisma.skill.findUnique.mockResolvedValue(null)
    await expect(service.historico(SKILL_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("cobertura mapea seccion -> { seccionId, moduloId, tituloSeccion }", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID })
    prisma.seccionSkill.findMany.mockResolvedValue([
      { seccion: { id: "s1", titulo: "Seccion 1", moduloId: "m1" } },
    ])
    const res = await service.cobertura(SKILL_ID)
    expect(res.secciones).toEqual([{ seccionId: "s1", moduloId: "m1", tituloSeccion: "Seccion 1" }])
  })
})
