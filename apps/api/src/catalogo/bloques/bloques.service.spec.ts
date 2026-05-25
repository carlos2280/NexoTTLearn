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

// Contenidos validos minimos por tipo. Sirven para tests que NO testean
// el contenido en si, solo otras ramas del service. Cualquier contenido
// que llegue al `tx.bloque.create/update` ya pasa por
// `validarContenidoBloque` (Fase 2), asi que tiene que ser real.
const CONTENIDO_PARRAFO_VACIO = { html: "", textoPlano: "", tiempoLecturaMin: 0 }
const CONTENIDO_QUIZ_MIN = {
  intentosMax: null,
  solucionVisible: "al_aprobar" as const,
  ordenAleatorio: false,
  notaMinima: 60,
  preguntas: [
    {
      id: "p1",
      tipo: "OPCION_UNICA" as const,
      enunciado: "?",
      pesoPunto: 1,
      opciones: [
        { id: "a", texto: "A", esCorrecta: true },
        { id: "b", texto: "B", esCorrecta: false },
      ],
    },
  ],
}

function buildDetalleRow(
  overrides: Partial<{
    estado: EstadoBloque
    version: number
    tipo: TipoBloque
    contenido: Record<string, unknown>
  }> = {},
) {
  const tipo = overrides.tipo ?? TipoBloque.QUIZ
  const evaluable = tipo === TipoBloque.QUIZ || tipo === TipoBloque.CODIGO_PREGUNTAS
  return {
    id: BLO_ID,
    seccionId: SEC_ID,
    orden: 1,
    tipo,
    esEvaluable: evaluable,
    skillQueMideId: evaluable ? SKILL_ID : null,
    estado: overrides.estado ?? EstadoBloque.ACTIVO,
    version: overrides.version ?? 1,
    contenido: overrides.contenido ?? CONTENIDO_QUIZ_MIN,
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

describe("BloquesService.obtenerContenidoPorSeccion", () => {
  it("seccion inexistente: 404 SECCION_NO_ENCONTRADA", async () => {
    prisma.seccion.findUnique.mockResolvedValue(null)
    try {
      await service.obtenerContenidoPorSeccion(SEC_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.seccionNoEncontrada)
    }
  })

  it("devuelve bloques ACTIVOS con `contenido` incluido, ordenados por orden ASC", async () => {
    prisma.seccion.findUnique.mockResolvedValue({ id: SEC_ID })
    prisma.bloque.findMany.mockResolvedValue([
      buildDetalleRow({ tipo: TipoBloque.PARRAFO, contenido: CONTENIDO_PARRAFO_VACIO }),
    ])
    const result = await service.obtenerContenidoPorSeccion(SEC_ID)

    const llamada = prisma.bloque.findMany.mock.calls[0]?.[0] as {
      where: { seccionId: string; estado: EstadoBloque }
      select: Record<string, true>
      orderBy: { orden: "asc" | "desc" }
    }
    expect(llamada.where.seccionId).toBe(SEC_ID)
    expect(llamada.where.estado).toBe(EstadoBloque.ACTIVO)
    expect(llamada.select).toHaveProperty("contenido", true)
    expect(llamada.orderBy.orden).toBe("asc")
    expect(result).toHaveLength(1)
    expect(result[0]?.contenido).toEqual(CONTENIDO_PARRAFO_VACIO)
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
          contenido: CONTENIDO_QUIZ_MIN,
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
        contenido: CONTENIDO_QUIZ_MIN,
      },
      ADMIN_ID,
    )
    expect(res.id).toBe(BLO_ID)
    expect(prisma.bloque.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 5 }) }),
    )
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ accion: "BLOQUE_CREADO" }))
  })

  it("contenido invalido para el tipo: 400 CONTENIDO_BLOQUE_INVALIDO antes del tx", async () => {
    prisma.seccion.findUnique.mockResolvedValue({ id: SEC_ID })
    await expect(
      service.crear(
        SEC_ID,
        {
          tipo: TipoBloque.PARRAFO,
          esEvaluable: false,
          // Falta `html`, `textoPlano`, `tiempoLecturaMin` — shape inventado.
          contenido: { texto: "hola" },
        },
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.contenidoBloqueInvalido },
    })
    // El tx no debe correr — la validacion va ANTES.
    expect(prisma.bloque.create).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })

  it("PARRAFO con contenido vacio valido (estado inicial del editor): 201", async () => {
    prisma.seccion.findUnique.mockResolvedValue({ id: SEC_ID })
    prisma.bloque.aggregate.mockResolvedValue({ _max: { orden: 0 } })
    prisma.bloque.create.mockResolvedValue(
      buildDetalleRow({ tipo: TipoBloque.PARRAFO, contenido: CONTENIDO_PARRAFO_VACIO }),
    )
    const res = await service.crear(
      SEC_ID,
      {
        tipo: TipoBloque.PARRAFO,
        esEvaluable: false,
        contenido: CONTENIDO_PARRAFO_VACIO,
      },
      ADMIN_ID,
    )
    expect(res.id).toBe(BLO_ID)
    expect(prisma.bloque.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: TipoBloque.PARRAFO, orden: 1 }),
      }),
    )
  })
})

describe("BloquesService.patch", () => {
  it("COSMETICO: solo contenido, no incrementa version, no exige motivo", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 3,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: false,
      skillQueMideId: null,
      tipo: TipoBloque.PARRAFO,
    })
    prisma.bloque.update.mockResolvedValue(
      buildDetalleRow({ version: 3, tipo: TipoBloque.PARRAFO, contenido: CONTENIDO_PARRAFO_VACIO }),
    )
    const res = await service.patch(
      BLO_ID,
      {
        tipoEdicion: "COSMETICO",
        contenido: { html: "<p>nuevo</p>", textoPlano: "nuevo", tiempoLecturaMin: 0 },
      },
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

  it("COSMETICO con contenido invalido para el tipo: 400 CONTENIDO_BLOQUE_INVALIDO", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 3,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: false,
      skillQueMideId: null,
      tipo: TipoBloque.PARRAFO,
    })
    await expect(
      service.patch(
        BLO_ID,
        // Falta `tiempoLecturaMin` y campo extra `texto` — shape invalido.
        { tipoEdicion: "COSMETICO", contenido: { html: "", textoPlano: "", texto: "viejo" } },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.contenidoBloqueInvalido },
    })
    expect(prisma.bloque.update).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })

  it("CAMBIA_EVALUACION sin motivo: 422 MOTIVO_REQUERIDO", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
      tipo: TipoBloque.QUIZ,
    })
    await expect(
      service.patch(
        BLO_ID,
        { tipoEdicion: "CAMBIA_EVALUACION", contenido: CONTENIDO_QUIZ_MIN },
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
      esEvaluable: false,
      skillQueMideId: null,
      tipo: TipoBloque.PARRAFO,
    })
    prisma.bloque.update.mockResolvedValue(
      buildDetalleRow({ version: 6, tipo: TipoBloque.PARRAFO, contenido: CONTENIDO_PARRAFO_VACIO }),
    )
    prisma.intentoBloque.updateMany.mockResolvedValue({ count: 0 })
    const res = await service.patch(
      BLO_ID,
      { tipoEdicion: "CAMBIA_EVALUACION", contenido: CONTENIDO_PARRAFO_VACIO },
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
      tipo: TipoBloque.PARRAFO,
    })
    await expect(
      service.patch(
        BLO_ID,
        {
          tipoEdicion: "CAMBIA_EVALUACION",
          contenido: CONTENIDO_PARRAFO_VACIO,
          esEvaluable: true,
        },
        "motivo",
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("CAMBIA_EVALUACION: releer skill en tx detecta race si se archiva durante la transaccion, 409", async () => {
    // Lectura previa fuera del tx: bloque ACTIVO.
    prisma.bloque.findUnique.mockResolvedValueOnce({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ACTIVO,
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
      tipo: TipoBloque.QUIZ,
    })
    // Dentro del tx: bloque sigue ACTIVO, pero la skill paso a ARCHIVADA.
    prisma.bloque.findUnique.mockResolvedValueOnce({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ACTIVO,
    })
    prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ARCHIVADA })
    await expect(
      service.patch(
        BLO_ID,
        {
          tipoEdicion: "CAMBIA_EVALUACION",
          contenido: CONTENIDO_QUIZ_MIN,
          skillQueMideId: SKILL_ID,
        },
        "ajuste de rubrica",
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.skillNoActiva } })
    expect(prisma.bloque.update).not.toHaveBeenCalled()
    expect(prisma.intentoBloque.updateMany).not.toHaveBeenCalled()
    expect(audit.record).not.toHaveBeenCalled()
  })

  it("bloque ya eliminado: 409 BLOQUE_YA_ELIMINADO", async () => {
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLO_ID,
      version: 1,
      estado: EstadoBloque.ELIMINADO,
      esEvaluable: false,
      skillQueMideId: null,
      tipo: TipoBloque.PARRAFO,
    })
    await expect(
      service.patch(
        BLO_ID,
        { tipoEdicion: "COSMETICO", contenido: CONTENIDO_PARRAFO_VACIO },
        undefined,
        ADMIN_ID,
      ),
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

describe("BloquesService.listarPorSeccion (FIX-pre-S12)", () => {
  it("404 SECCION_NO_ENCONTRADA si la seccion no existe", async () => {
    prisma.seccion.findUnique.mockResolvedValueOnce(null)
    await expect(service.listarPorSeccion(SEC_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.seccionNoEncontrada },
    })
    expect(prisma.bloque.findMany).not.toHaveBeenCalled()
  })

  it("happy: devuelve solo ACTIVOS de esa seccion, ordenados por orden ASC", async () => {
    prisma.seccion.findUnique.mockResolvedValueOnce({ id: SEC_ID })
    prisma.bloque.findMany.mockResolvedValueOnce([
      buildDetalleRow({ version: 1 }),
      { ...buildDetalleRow({ version: 1 }), id: "33333333-3333-3333-3333-333333333334", orden: 2 },
    ])
    const out = await service.listarPorSeccion(SEC_ID)
    expect(out).toHaveLength(2)
    const findManyArg = prisma.bloque.findMany.mock.calls[0]?.[0] as {
      where: { seccionId: string; estado: EstadoBloque }
      orderBy: { orden: "asc" | "desc" }
    }
    expect(findManyArg.where.seccionId).toBe(SEC_ID)
    expect(findManyArg.where.estado).toBe(EstadoBloque.ACTIVO)
    expect(findManyArg.orderBy).toEqual({ orden: "asc" })
  })
})
