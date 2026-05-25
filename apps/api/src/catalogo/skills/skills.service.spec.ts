import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
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
    findUniqueOrThrow: ReturnType<typeof vi.fn>
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
  historicoCambiosAreaSkill: {
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  seccionSkill: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  cursoSkillExigida: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  cursoAreaExigida: { findMany: ReturnType<typeof vi.fn> }
  bloque: {
    count: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  curso: { findMany: ReturnType<typeof vi.fn> }
  modulo: { findMany: ReturnType<typeof vi.fn> }
  seccion: { findMany: ReturnType<typeof vi.fn> }
  transversalSkill: { count: ReturnType<typeof vi.fn> }
  notaSkill: { count: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    skill: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    area: { findUnique: vi.fn() },
    historicoRenombradoSkill: { create: vi.fn(), findMany: vi.fn() },
    historicoCambiosAreaSkill: { create: vi.fn(), findMany: vi.fn() },
    seccionSkill: {
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    cursoSkillExigida: {
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    cursoAreaExigida: { findMany: vi.fn() },
    bloque: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    curso: { findMany: vi.fn() },
    modulo: { findMany: vi.fn() },
    seccion: { findMany: vi.fn() },
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
const AREA_DESTINO_ID = "33333333-3333-3333-3333-333333333333"
const SKILL_GANADORA_ID = "44444444-4444-4444-4444-444444444444"
const SKILL_PERDEDORA_ID = "55555555-5555-5555-5555-555555555555"

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
        motivo: "Correccion ortografica",
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
  it("archivar OK + audit con metadata.motivo (cierre §5.20)", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    prisma.skill.update.mockResolvedValue({ id: SKILL_ID })
    await service.archivar(SKILL_ID, "obsoleta", ADMIN_ID)
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoSkill.ARCHIVADA } }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "SKILL_ARCHIVADA",
        metadata: { motivo: "obsoleta" },
      }),
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
  it("sin referencias: hard delete + audit SKILL_ELIMINADA con metadata.motivo", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, etiquetaVisible: "vieja" })
    prisma.seccionSkill.count.mockResolvedValue(0)
    prisma.cursoSkillExigida.count.mockResolvedValue(0)
    prisma.bloque.count.mockResolvedValue(0)
    prisma.transversalSkill.count.mockResolvedValue(0)
    prisma.notaSkill.count.mockResolvedValue(0)
    await service.eliminar(SKILL_ID, "obsoleta", ADMIN_ID)
    expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: SKILL_ID } })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "SKILL_ELIMINADA",
        metadata: { motivo: "obsoleta" },
      }),
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

describe("SkillsService.previewCambioArea (P3b)", () => {
  it("OK: devuelve impacto con cursos union (directos + por area) y modulos union (secciones_skill + bloques)", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, areaId: AREA_ID })
    prisma.area.findUnique.mockResolvedValue({ id: AREA_DESTINO_ID })
    prisma.cursoSkillExigida.findMany.mockResolvedValue([{ cursoId: "c1" }])
    prisma.cursoAreaExigida.findMany.mockResolvedValue([{ cursoId: "c2" }, { cursoId: "c1" }])
    prisma.seccionSkill.findMany.mockResolvedValue([{ seccionId: "s1" }])
    prisma.bloque.findMany.mockResolvedValue([{ seccionId: "s2" }])
    prisma.bloque.count.mockResolvedValue(3)
    prisma.seccionSkill.count.mockResolvedValue(1)
    prisma.curso.findMany.mockResolvedValue([
      { id: "c1", titulo: "Curso 1" },
      { id: "c2", titulo: "Curso 2" },
    ])
    prisma.seccion.findMany.mockResolvedValue([{ moduloId: "m1" }, { moduloId: "m2" }])
    prisma.modulo.findMany.mockResolvedValue([
      { id: "m1", titulo: "Modulo 1" },
      { id: "m2", titulo: "Modulo 2" },
    ])

    const res = await service.previewCambioArea(SKILL_ID, AREA_DESTINO_ID)
    expect(res.skillId).toBe(SKILL_ID)
    expect(res.areaActualId).toBe(AREA_ID)
    expect(res.areaDestinoId).toBe(AREA_DESTINO_ID)
    expect(res.impacto.cursosAfectados).toHaveLength(2)
    expect(res.impacto.modulosAfectados).toHaveLength(2)
    expect(res.impacto.bloquesAfectados).toBe(3)
    expect(res.impacto.seccionesAfectadas).toBe(1)
    expect(res.impacto.totalReferencias).toBe(2 + 1 + 3)
    expect(audit.record).not.toHaveBeenCalled()
  })

  it("skill inexistente: 404 SKILL_NO_ENCONTRADA", async () => {
    prisma.skill.findUnique.mockResolvedValue(null)
    await expect(service.previewCambioArea(SKILL_ID, AREA_DESTINO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("area destino inexistente: 404 AREA_NO_ENCONTRADA", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, areaId: AREA_ID })
    prisma.area.findUnique.mockResolvedValue(null)
    await expect(service.previewCambioArea(SKILL_ID, AREA_DESTINO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("area destino == area actual: 409 SKILL_YA_EN_AREA_DESTINO", async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, areaId: AREA_ID })
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    try {
      await service.previewCambioArea(SKILL_ID, AREA_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.skillYaEnAreaDestino)
    }
  })
})

describe("SkillsService.cambiarArea (P3b)", () => {
  it("OK: actualiza skill, inserta historico con motivo y audita SKILL_CAMBIO_AREA con metadata", async () => {
    prisma.skill.findUnique.mockResolvedValue(buildSkillRow())
    prisma.area.findUnique.mockResolvedValue({ id: AREA_DESTINO_ID })
    prisma.skill.update.mockResolvedValue(buildSkillRow())

    const res = await service.cambiarArea(SKILL_ID, AREA_DESTINO_ID, "reorg. backend", ADMIN_ID)
    expect(res.id).toBe(SKILL_ID)
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SKILL_ID },
        data: { areaId: AREA_DESTINO_ID },
      }),
    )
    expect(prisma.historicoCambiosAreaSkill.create).toHaveBeenCalledWith({
      data: {
        skillId: SKILL_ID,
        areaAnteriorId: AREA_ID,
        areaNuevaId: AREA_DESTINO_ID,
        autorUsuarioId: ADMIN_ID,
        motivo: "reorg. backend",
      },
    })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "SKILL_CAMBIO_AREA",
        recursoId: SKILL_ID,
        metadata: {
          motivo: "reorg. backend",
          areaAnteriorId: AREA_ID,
          areaNuevaId: AREA_DESTINO_ID,
        },
      }),
    )
  })

  it("destino == actual: 409 SKILL_YA_EN_AREA_DESTINO sin escribir", async () => {
    prisma.skill.findUnique.mockResolvedValue(buildSkillRow())
    prisma.area.findUnique.mockResolvedValue({ id: AREA_ID })
    try {
      await service.cambiarArea(SKILL_ID, AREA_ID, "m", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
    }
    expect(prisma.skill.update).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })

  it("releer en tx detecta race: si la skill desaparece dentro de la transaccion, 404", async () => {
    // Lectura previa OK
    prisma.skill.findUnique.mockResolvedValueOnce(buildSkillRow())
    prisma.area.findUnique.mockResolvedValue({ id: AREA_DESTINO_ID })
    // Lectura dentro de tx: la skill fue eliminada por otro admin entre medias
    prisma.skill.findUnique.mockResolvedValueOnce(null)

    await expect(
      service.cambiarArea(SKILL_ID, AREA_DESTINO_ID, "race", ADMIN_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.skill.update).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })
})

describe("SkillsService.fusionar (P3b)", () => {
  function setupAmbasActivas(): void {
    prisma.skill.findUnique
      .mockResolvedValueOnce(
        buildSkillRow({
          id: SKILL_GANADORA_ID,
          etiquetaVisible: "ganadora",
          estado: EstadoSkill.ACTIVA,
        }),
      )
      .mockResolvedValueOnce(
        buildSkillRow({
          id: SKILL_PERDEDORA_ID,
          etiquetaVisible: "perdedora",
          estado: EstadoSkill.ACTIVA,
        }),
      )
  }

  it("OK: migra referencias, deduplica composite keys, archiva perdedora, audita con metadata", async () => {
    setupAmbasActivas()
    // Una seccion comparte ambas skills (debe deduplicar antes del updateMany).
    prisma.seccionSkill.findMany.mockResolvedValue([{ seccionId: "sec-dup" }])
    prisma.seccionSkill.deleteMany.mockResolvedValue({ count: 1 })
    prisma.seccionSkill.updateMany.mockResolvedValue({ count: 2 })
    // Un curso comparte ambas skills.
    prisma.cursoSkillExigida.findMany.mockResolvedValue([{ cursoId: "curso-dup" }])
    prisma.cursoSkillExigida.deleteMany.mockResolvedValue({ count: 1 })
    prisma.cursoSkillExigida.updateMany.mockResolvedValue({ count: 3 })
    // Bloques que median la perdedora.
    prisma.bloque.updateMany.mockResolvedValue({ count: 4 })
    prisma.skill.update.mockResolvedValue(
      buildSkillRow({
        id: SKILL_PERDEDORA_ID,
        etiquetaVisible: "perdedora",
        estado: EstadoSkill.ARCHIVADA,
      }),
    )
    prisma.skill.findUniqueOrThrow.mockResolvedValue(
      buildSkillRow({
        id: SKILL_GANADORA_ID,
        etiquetaVisible: "ganadora",
        estado: EstadoSkill.ACTIVA,
      }),
    )

    const res = await service.fusionar(
      SKILL_GANADORA_ID,
      SKILL_PERDEDORA_ID,
      "consolidacion",
      ADMIN_ID,
    )
    expect(res.skillGanadora.id).toBe(SKILL_GANADORA_ID)
    expect(res.skillPerdedora.estado).toBe(EstadoSkill.ARCHIVADA)
    expect(res.referenciasMigradas).toEqual({ secciones: 2, cursos: 3, bloques: 4 })

    expect(prisma.seccionSkill.deleteMany).toHaveBeenCalledWith({
      where: { skillId: SKILL_PERDEDORA_ID, seccionId: { in: ["sec-dup"] } },
    })
    expect(prisma.seccionSkill.updateMany).toHaveBeenCalledWith({
      where: { skillId: SKILL_PERDEDORA_ID },
      data: { skillId: SKILL_GANADORA_ID },
    })
    expect(prisma.cursoSkillExigida.deleteMany).toHaveBeenCalledWith({
      where: { skillId: SKILL_PERDEDORA_ID, cursoId: { in: ["curso-dup"] } },
    })
    expect(prisma.cursoSkillExigida.updateMany).toHaveBeenCalledWith({
      where: { skillId: SKILL_PERDEDORA_ID },
      data: { skillId: SKILL_GANADORA_ID },
    })
    expect(prisma.bloque.updateMany).toHaveBeenCalledWith({
      where: { skillQueMideId: SKILL_PERDEDORA_ID },
      data: { skillQueMideId: SKILL_GANADORA_ID },
    })
    expect(prisma.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SKILL_PERDEDORA_ID },
        data: { estado: EstadoSkill.ARCHIVADA },
      }),
    )
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "SKILL_FUSIONADA",
        recursoId: SKILL_GANADORA_ID,
        metadata: expect.objectContaining({
          motivo: "consolidacion",
          skillGanadoraId: SKILL_GANADORA_ID,
          skillPerdedoraId: SKILL_PERDEDORA_ID,
          referenciasMigradas: { secciones: 2, cursos: 3, bloques: 4 },
        }),
      }),
    )
  })

  it("NO toca nota_skill (consolidacion deferida a P7)", async () => {
    setupAmbasActivas()
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.seccionSkill.updateMany.mockResolvedValue({ count: 0 })
    prisma.cursoSkillExigida.findMany.mockResolvedValue([])
    prisma.cursoSkillExigida.updateMany.mockResolvedValue({ count: 0 })
    prisma.bloque.updateMany.mockResolvedValue({ count: 0 })
    prisma.skill.update.mockResolvedValue(
      buildSkillRow({ id: SKILL_PERDEDORA_ID, estado: EstadoSkill.ARCHIVADA }),
    )
    prisma.skill.findUniqueOrThrow.mockResolvedValue(buildSkillRow({ id: SKILL_GANADORA_ID }))

    await service.fusionar(SKILL_GANADORA_ID, SKILL_PERDEDORA_ID, "m", ADMIN_ID)
    expect(prisma.notaSkill.count).not.toHaveBeenCalled()
  })

  it("perdedora ARCHIVADA: 409 SKILL_NO_ACTIVA", async () => {
    prisma.skill.findUnique
      .mockResolvedValueOnce(buildSkillRow({ id: SKILL_GANADORA_ID, estado: EstadoSkill.ACTIVA }))
      .mockResolvedValueOnce(
        buildSkillRow({ id: SKILL_PERDEDORA_ID, estado: EstadoSkill.ARCHIVADA }),
      )

    try {
      await service.fusionar(SKILL_GANADORA_ID, SKILL_PERDEDORA_ID, "m", ADMIN_ID)
      throw new Error("se esperaba 409")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.skillNoActiva)
    }
  })

  it("ganadora == perdedora: 400 INVALID_BODY sin abrir transaccion", async () => {
    try {
      await service.fusionar(SKILL_GANADORA_ID, SKILL_GANADORA_ID, "m", ADMIN_ID)
      throw new Error("se esperaba 400")
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const r = (error as BadRequestException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.invalidBody)
    }
  })

  it("alguna skill no existe: 404 SKILL_NO_ENCONTRADA", async () => {
    prisma.skill.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildSkillRow({ id: SKILL_PERDEDORA_ID }))

    await expect(
      service.fusionar(SKILL_GANADORA_ID, SKILL_PERDEDORA_ID, "m", ADMIN_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
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
