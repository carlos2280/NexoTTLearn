import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import type {
  ActualizarEvaluacionInicialAdminInput,
  UpsertEvaluacionInicialAdminInput,
  actualizarEvaluacionInicialAdminInputSchema,
  upsertEvaluacionInicialAdminInputSchema,
} from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { InscripcionesEvaluacionesInicialesService } from "./inscripciones-evaluaciones-iniciales.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  inscripcion: { findUnique: Stub }
  cursoArea: { findUnique: Stub }
  evaluacionInicial: {
    findUnique: Stub
    findUniqueOrThrow: Stub
    findMany: Stub
    create: Stub
    update: Stub
    delete: Stub
  }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    inscripcion: { findUnique: vi.fn() },
    cursoArea: { findUnique: vi.fn() },
    evaluacionInicial: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    logActividad: { create: vi.fn() },
    $transaction: vi.fn((arg: unknown) => {
      if (typeof arg === "function") {
        const fn = arg as (tx: PrismaMock) => Promise<unknown>
        return fn(prisma)
      }
      return Promise.all(arg as Promise<unknown>[])
    }),
  }
  return prisma
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  const service = new InscripcionesEvaluacionesInicialesService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000002"
const AREA_ID = "00000000-0000-0000-0000-000000000003"
const CURSO_ID = "00000000-0000-0000-0000-000000000004"
const EVAL_ID = "00000000-0000-0000-0000-000000000005"

const NOW = new Date("2026-05-06T10:00:00Z")

type EstadoCurso = "BORRADOR" | "ACTIVO" | "CERRADO"
type EstadoInscripcion = "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
type TipoInscripcion = "SOLICITUD" | "LIBRE"

function buildInscripcion(
  overrides: Partial<{
    estado: EstadoInscripcion
    tipo: TipoInscripcion
    cursoEstado: EstadoCurso
  }> = {},
) {
  return {
    id: INSCRIPCION_ID,
    cursoId: CURSO_ID,
    estado: overrides.estado ?? ("ACTIVA" as const),
    tipo: overrides.tipo ?? ("SOLICITUD" as const),
    curso: { id: CURSO_ID, estado: overrides.cursoEstado ?? ("ACTIVO" as const) },
  }
}

function buildEvaluacionRow(
  overrides: Partial<{
    id: string
    puntaje: number
    observaciones: string | null
    capturadaPorId: string
    areaNombre: string
  }> = {},
) {
  return {
    id: overrides.id ?? EVAL_ID,
    inscripcionId: INSCRIPCION_ID,
    areaId: AREA_ID,
    puntaje: overrides.puntaje ?? 60,
    observaciones: overrides.observaciones ?? null,
    capturadaPorId: overrides.capturadaPorId ?? ACTOR_ID,
    capturadaAt: NOW,
    updatedAt: NOW,
    area: { nombre: overrides.areaNombre ?? "Frontend" },
  }
}

// ─────────────────────────────────────────────────────────────────
// LISTAR
// ─────────────────────────────────────────────────────────────────

describe("listar", () => {
  it("devuelve lista vacia si no hay capturas", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findMany.mockResolvedValue([])

    const result = await service.listar(INSCRIPCION_ID)
    expect(result.items).toEqual([])
  })

  it("devuelve lista con capturas existentes", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findMany.mockResolvedValue([
      buildEvaluacionRow({ areaNombre: "Frontend", puntaje: 70 }),
      buildEvaluacionRow({ id: "x2", puntaje: 40, areaNombre: "Backend" }),
    ])

    const result = await service.listar(INSCRIPCION_ID)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]?.puntaje).toBe(70)
    expect(result.items[1]?.areaNombre).toBe("Backend")
  })

  it("lanza 404 si la inscripcion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)

    await expect(service.listar(INSCRIPCION_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// OBTENER
// ─────────────────────────────────────────────────────────────────

describe("obtener", () => {
  it("devuelve la captura cuando existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findUnique.mockResolvedValue(buildEvaluacionRow())

    const result = await service.obtener(INSCRIPCION_ID, AREA_ID)
    expect(result.id).toBe(EVAL_ID)
    expect(result.puntaje).toBe(60)
  })

  it("lanza 404 si la inscripcion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)

    await expect(service.obtener(INSCRIPCION_ID, AREA_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si no hay captura para esa area", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findUnique.mockResolvedValue(null)

    await expect(service.obtener(INSCRIPCION_ID, AREA_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// UPSERT
// ─────────────────────────────────────────────────────────────────

describe("upsert", () => {
  const input: UpsertEvaluacionInicialAdminInput = {
    puntaje: 75,
    observaciones: "Buen dominio HTML/CSS",
  }

  it("crea la captura cuando no existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.cursoArea.findUnique.mockResolvedValue({ id: "cursoArea-1" })
    prisma.evaluacionInicial.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue(buildEvaluacionRow({ puntaje: 75 }))
    prisma.evaluacionInicial.create.mockResolvedValue(buildEvaluacionRow({ puntaje: 75 }))
    prisma.evaluacionInicial.findUniqueOrThrow.mockResolvedValue(
      buildEvaluacionRow({ puntaje: 75 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)
    expect(result.puntaje).toBe(75)
    expect(prisma.evaluacionInicial.create).toHaveBeenCalled()
    expect(prisma.evaluacionInicial.update).not.toHaveBeenCalled()
  })

  it("actualiza la captura cuando ya existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.cursoArea.findUnique.mockResolvedValue({ id: "cursoArea-1" })
    const existente = buildEvaluacionRow({ puntaje: 50 })
    prisma.evaluacionInicial.findUnique.mockResolvedValue(existente)
    prisma.evaluacionInicial.update.mockResolvedValue(buildEvaluacionRow({ puntaje: 75 }))
    prisma.evaluacionInicial.findUniqueOrThrow.mockResolvedValue(
      buildEvaluacionRow({ puntaje: 75 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)
    expect(result.puntaje).toBe(75)
    expect(prisma.evaluacionInicial.update).toHaveBeenCalled()
    expect(prisma.evaluacionInicial.create).not.toHaveBeenCalled()
  })

  it("registra log con tipoAccion CURSO_ACTUALIZADO y entidadTipo EvaluacionInicial", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.cursoArea.findUnique.mockResolvedValue({ id: "cursoArea-1" })
    prisma.evaluacionInicial.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue(buildEvaluacionRow({ puntaje: 75 }))
    prisma.evaluacionInicial.create.mockResolvedValue(buildEvaluacionRow({ puntaje: 75 }))
    prisma.evaluacionInicial.findUniqueOrThrow.mockResolvedValue(
      buildEvaluacionRow({ puntaje: 75 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    await service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)

    expect(prisma.logActividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipoAccion: "CURSO_ACTUALIZADO",
          entidadTipo: "EvaluacionInicial",
          actorId: ACTOR_ID,
        }),
      }),
    )
  })

  it("lanza 400 si el area no pertenece al curso de la inscripcion", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.cursoArea.findUnique.mockResolvedValue(null)

    await expect(service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)).rejects.toThrow(
      BadRequestException,
    )
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ cursoEstado: "CERRADO" }))

    await expect(service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 409 si la inscripcion no esta ACTIVA", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ estado: "COMPLETADA" }))

    await expect(service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 409 si la inscripcion es de tipo LIBRE", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ tipo: "LIBRE" }))

    await expect(service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si la inscripcion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(null)

    await expect(service.upsert(INSCRIPCION_ID, AREA_ID, input, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("schema rechaza puntaje fuera de rango (101)", () => {
    const { upsertEvaluacionInicialAdminInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        upsertEvaluacionInicialAdminInputSchema: typeof upsertEvaluacionInicialAdminInputSchema
      }
    const result = schema.safeParse({ puntaje: 101 })
    expect(result.success).toBe(false)
  })

  it("schema rechaza puntaje no entero (75.5)", () => {
    const { upsertEvaluacionInicialAdminInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        upsertEvaluacionInicialAdminInputSchema: typeof upsertEvaluacionInicialAdminInputSchema
      }
    const result = schema.safeParse({ puntaje: 75.5 })
    expect(result.success).toBe(false)
  })

  it("schema rechaza claves desconocidas (.strict())", () => {
    const { upsertEvaluacionInicialAdminInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        upsertEvaluacionInicialAdminInputSchema: typeof upsertEvaluacionInicialAdminInputSchema
      }
    const result = schema.safeParse({ puntaje: 50, capturadaPorId: "spoofed" })
    expect(result.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR (PATCH)
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza solo puntaje cuando se proporciona", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findUnique.mockResolvedValue(buildEvaluacionRow())
    prisma.evaluacionInicial.update.mockResolvedValue(buildEvaluacionRow({ puntaje: 90 }))
    prisma.evaluacionInicial.findUniqueOrThrow.mockResolvedValue(
      buildEvaluacionRow({ puntaje: 90 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.actualizar(INSCRIPCION_ID, AREA_ID, { puntaje: 90 }, ACTOR_ID)
    expect(result.puntaje).toBe(90)
  })

  it("schema rechaza patch vacio", () => {
    const { actualizarEvaluacionInicialAdminInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        actualizarEvaluacionInicialAdminInputSchema: typeof actualizarEvaluacionInicialAdminInputSchema
      }
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("schema acepta patch parcial con solo observaciones", () => {
    const { actualizarEvaluacionInicialAdminInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        actualizarEvaluacionInicialAdminInputSchema: typeof actualizarEvaluacionInicialAdminInputSchema
      }
    const result = schema.safeParse({ observaciones: "Notas" })
    expect(result.success).toBe(true)
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ cursoEstado: "CERRADO" }))

    await expect(
      service.actualizar(INSCRIPCION_ID, AREA_ID, { puntaje: 90 }, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la inscripcion no esta ACTIVA", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ estado: "ABANDONADA" }))

    await expect(
      service.actualizar(INSCRIPCION_ID, AREA_ID, { puntaje: 90 }, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si no hay captura para esa area", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findUnique.mockResolvedValue(null)

    await expect(
      service.actualizar(INSCRIPCION_ID, AREA_ID, { puntaje: 90 }, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })

  it("permite mutacion en curso BORRADOR ademas de ACTIVO", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ cursoEstado: "BORRADOR" }))
    prisma.evaluacionInicial.findUnique.mockResolvedValue(buildEvaluacionRow())
    prisma.evaluacionInicial.update.mockResolvedValue(buildEvaluacionRow({ puntaje: 80 }))
    prisma.evaluacionInicial.findUniqueOrThrow.mockResolvedValue(
      buildEvaluacionRow({ puntaje: 80 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const patch: ActualizarEvaluacionInicialAdminInput = { puntaje: 80 }
    await expect(
      service.actualizar(INSCRIPCION_ID, AREA_ID, patch, ACTOR_ID),
    ).resolves.toMatchObject({ puntaje: 80 })
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina la captura existente", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findUnique.mockResolvedValue(buildEvaluacionRow())
    prisma.evaluacionInicial.delete.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.eliminar(INSCRIPCION_ID, AREA_ID, ACTOR_ID)
    expect(result).toEqual({ tipo: "ELIMINADO", id: EVAL_ID })
  })

  it("lanza 404 si no hay captura para esa area", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion())
    prisma.evaluacionInicial.findUnique.mockResolvedValue(null)

    await expect(service.eliminar(INSCRIPCION_ID, AREA_ID, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(buildInscripcion({ cursoEstado: "CERRADO" }))

    await expect(service.eliminar(INSCRIPCION_ID, AREA_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 409 si la inscripcion no esta ACTIVA", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.findUnique.mockResolvedValue(
      buildInscripcion({ estado: "CERRADO_SIN_COMPLETAR" }),
    )

    await expect(service.eliminar(INSCRIPCION_ID, AREA_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })
})
