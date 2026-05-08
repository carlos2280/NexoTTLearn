import { ConflictException, NotFoundException } from "@nestjs/common"
import type { UpsertEntrevistaIAAdminInput } from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosEntrevistaIAService } from "./cursos-entrevista-ia.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub; findUniqueOrThrow: Stub; update: Stub }
  entrevistaIAConfig: {
    findUnique: Stub
    findUniqueOrThrow: Stub
    create: Stub
    update: Stub
    delete: Stub
  }
  entrevistaIASesion: { count: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        pesoAreas: { toString: () => "100" },
        pesoEntrevistaIA: { toString: () => "0" },
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    entrevistaIAConfig: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    entrevistaIASesion: { count: vi.fn() },
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
  const service = new CursosEntrevistaIAService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const EI_ID = "00000000-0000-0000-0000-000000000003"

const NOW = new Date("2026-05-06T10:00:00Z")

function buildCursoRow(estado: "BORRADOR" | "ACTIVO" | "CERRADO" = "BORRADOR") {
  return { id: CURSO_ID, estado }
}

function buildEiRow(
  overrides: Partial<{
    id: string
    perfilCliente: string
    contextoNegocio: string
    umbralAprobacion: number
    numeroPreguntas: number
    modo: "TEXTO" | "VOZ"
    maxIntentos: number
  }> = {},
) {
  return {
    id: overrides.id ?? EI_ID,
    cursoId: CURSO_ID,
    perfilCliente: overrides.perfilCliente ?? "CTO scaleup fintech",
    contextoNegocio: overrides.contextoNegocio ?? "Plataforma de pagos B2B",
    umbralAprobacion: overrides.umbralAprobacion ?? 70,
    numeroPreguntas: overrides.numeroPreguntas ?? 8,
    modo: overrides.modo ?? "TEXTO",
    maxIntentos: overrides.maxIntentos ?? 3,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

const inputUpsert: UpsertEntrevistaIAAdminInput = {
  perfilCliente: "CTO scaleup fintech",
  contextoNegocio: "Plataforma de pagos B2B",
  umbralAprobacion: 70,
  numeroPreguntas: 8,
  modo: "TEXTO",
  maxIntentos: 3,
}

// ─────────────────────────────────────────────────────────────────
// OBTENER
// ─────────────────────────────────────────────────────────────────

describe("obtener", () => {
  it("devuelve la entrevista cuando existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow())

    const result = await service.obtener(CURSO_ID)
    expect(result.id).toBe(EI_ID)
    expect(result.modo).toBe("TEXTO")
    expect(result.numeroPreguntas).toBe(8)
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.obtener(CURSO_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si la entrevista no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(null)

    await expect(service.obtener(CURSO_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// UPSERT
// ─────────────────────────────────────────────────────────────────

describe("upsert", () => {
  it("crea la entrevista si no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValueOnce(null).mockResolvedValue(buildEiRow())
    prisma.entrevistaIAConfig.create.mockResolvedValue(buildEiRow())
    prisma.entrevistaIAConfig.findUniqueOrThrow.mockResolvedValue(buildEiRow())
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(CURSO_ID, inputUpsert, ACTOR_ID)
    expect(result.perfilCliente).toBe(inputUpsert.perfilCliente)
    expect(prisma.entrevistaIAConfig.create).toHaveBeenCalled()
  })

  it("actualiza la entrevista si ya existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow({ perfilCliente: "Antiguo" }))
    prisma.entrevistaIAConfig.update.mockResolvedValue(buildEiRow())
    prisma.entrevistaIAConfig.findUniqueOrThrow.mockResolvedValue(buildEiRow())
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(CURSO_ID, inputUpsert, ACTOR_ID)
    expect(result.perfilCliente).toBe(inputUpsert.perfilCliente)
    expect(prisma.entrevistaIAConfig.update).toHaveBeenCalled()
    expect(prisma.entrevistaIAConfig.create).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("CERRADO"))

    await expect(service.upsert(CURSO_ID, inputUpsert, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.upsert(CURSO_ID, inputUpsert, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR (PATCH)
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza umbralAprobacion y modo correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow())
    prisma.entrevistaIAConfig.update.mockResolvedValue(
      buildEiRow({ umbralAprobacion: 80, modo: "VOZ" }),
    )
    prisma.entrevistaIAConfig.findUniqueOrThrow.mockResolvedValue(
      buildEiRow({ umbralAprobacion: 80, modo: "VOZ" }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.actualizar(
      CURSO_ID,
      { umbralAprobacion: 80, modo: "VOZ" },
      ACTOR_ID,
    )
    expect(result.umbralAprobacion).toBe(80)
    expect(result.modo).toBe("VOZ")
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("CERRADO"))

    await expect(service.actualizar(CURSO_ID, { umbralAprobacion: 80 }, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si la entrevista no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(null)

    await expect(service.actualizar(CURSO_ID, { umbralAprobacion: 80 }, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina la entrevista en curso BORRADOR sin sesiones", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow())
    prisma.entrevistaIASesion.count.mockResolvedValue(0)
    prisma.entrevistaIAConfig.delete.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.eliminar(CURSO_ID, ACTOR_ID)
    expect(result).toEqual({ tipo: "ELIMINADO", id: EI_ID })
  })

  it("lanza 409 si el curso no es BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("ACTIVO"))

    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si hay sesiones registradas", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow())
    prisma.entrevistaIASesion.count.mockResolvedValue(2)

    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si la entrevista no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(null)

    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })

  it("MAESTRO §9.7 + constraint: transfiere pesoEntrevistaIA a pesoAreas al eliminar", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow())
    prisma.entrevistaIASesion.count.mockResolvedValue(0)
    prisma.entrevistaIAConfig.delete.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})
    prisma.curso.findUniqueOrThrow.mockResolvedValue({
      pesoAreas: { toString: () => "70" },
      pesoEntrevistaIA: { toString: () => "10" },
    })

    await service.eliminar(CURSO_ID, ACTOR_ID)

    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CURSO_ID },
        data: { pesoAreas: 80, pesoEntrevistaIA: 0 },
      }),
    )
  })

  it("no escribe curso.update si pesoEntrevistaIA ya era 0", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.entrevistaIAConfig.findUnique.mockResolvedValue(buildEiRow())
    prisma.entrevistaIASesion.count.mockResolvedValue(0)
    prisma.entrevistaIAConfig.delete.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})

    await service.eliminar(CURSO_ID, ACTOR_ID)

    expect(prisma.curso.update).not.toHaveBeenCalled()
  })
})
