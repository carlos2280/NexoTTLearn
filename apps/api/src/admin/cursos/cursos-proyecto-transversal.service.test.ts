import { ConflictException, NotFoundException } from "@nestjs/common"
import type {
  AjustarPesosProyectoTransversalInput,
  AjustarUmbralProyectoTransversalInput,
  UpsertProyectoTransversalAdminInput,
  ajustarPesosProyectoTransversalInputSchema,
} from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosProyectoTransversalService } from "./cursos-proyecto-transversal.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  proyectoTransversal: {
    findUnique: Stub
    findUniqueOrThrow: Stub
    create: Stub
    update: Stub
    delete: Stub
  }
  entregaProyecto: { count: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: { findUnique: vi.fn() },
    proyectoTransversal: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    entregaProyecto: { count: vi.fn() },
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
  const service = new CursosProyectoTransversalService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const PT_ID = "00000000-0000-0000-0000-000000000003"

const NOW = new Date("2026-05-06T10:00:00Z")

function buildCursoRow(estado: "BORRADOR" | "ACTIVO" | "CERRADO" = "BORRADOR") {
  return { id: CURSO_ID, estado }
}

function buildPtRow(
  overrides: Partial<{
    id: string
    titulo: string
    enunciado: string
    umbralAprobacion: number
    pesoCapa1: unknown
    pesoCapa2: unknown
    pesoCapa3: unknown
  }> = {},
) {
  return {
    id: overrides.id ?? PT_ID,
    cursoId: CURSO_ID,
    titulo: overrides.titulo ?? "Proyecto Transversal",
    enunciado: overrides.enunciado ?? "Construye una app full-stack",
    umbralAprobacion: overrides.umbralAprobacion ?? 70,
    pesoCapa1: overrides.pesoCapa1 ?? { toNumber: () => 40 },
    pesoCapa2: overrides.pesoCapa2 ?? { toNumber: () => 30 },
    pesoCapa3: overrides.pesoCapa3 ?? { toNumber: () => 30 },
    createdAt: NOW,
    updatedAt: NOW,
  }
}

// ─────────────────────────────────────────────────────────────────
// OBTENER
// ─────────────────────────────────────────────────────────────────

describe("obtener", () => {
  it("devuelve el proyecto transversal cuando existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())

    const result = await service.obtener(CURSO_ID)
    expect(result.id).toBe(PT_ID)
    expect(result.cursoId).toBe(CURSO_ID)
    expect(result.umbralAprobacion).toBe(70)
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.obtener(CURSO_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si el proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(null)

    await expect(service.obtener(CURSO_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// UPSERT
// ─────────────────────────────────────────────────────────────────

describe("upsert", () => {
  const input: UpsertProyectoTransversalAdminInput = {
    titulo: "Proyecto Final",
    enunciado: "Diseña e implementa una API REST con frontend SPA",
  }

  it("crea el proyecto si no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue(buildPtRow({ titulo: input.titulo }))
    prisma.proyectoTransversal.create.mockResolvedValue(buildPtRow({ titulo: input.titulo }))
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(
      buildPtRow({ titulo: input.titulo }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(CURSO_ID, input, ACTOR_ID)
    expect(result.titulo).toBe(input.titulo)
    expect(prisma.proyectoTransversal.create).toHaveBeenCalled()
  })

  it("actualiza el proyecto si ya existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow({ titulo: "Viejo" }))
    prisma.proyectoTransversal.update.mockResolvedValue(buildPtRow({ titulo: input.titulo }))
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(
      buildPtRow({ titulo: input.titulo }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(CURSO_ID, input, ACTOR_ID)
    expect(result.titulo).toBe(input.titulo)
    expect(prisma.proyectoTransversal.update).toHaveBeenCalled()
    expect(prisma.proyectoTransversal.create).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("CERRADO"))

    await expect(service.upsert(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.upsert(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR (PATCH)
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza titulo correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.update.mockResolvedValue(buildPtRow({ titulo: "Nuevo titulo" }))
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(
      buildPtRow({ titulo: "Nuevo titulo" }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.actualizar(CURSO_ID, { titulo: "Nuevo titulo" }, ACTOR_ID)
    expect(result.titulo).toBe("Nuevo titulo")
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("CERRADO"))

    await expect(service.actualizar(CURSO_ID, { titulo: "X" }, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(null)

    await expect(service.actualizar(CURSO_ID, { titulo: "X" }, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina el proyecto en curso BORRADOR sin entregas", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.entregaProyecto.count.mockResolvedValue(0)
    prisma.proyectoTransversal.delete.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.eliminar(CURSO_ID, ACTOR_ID)
    expect(result).toEqual({ tipo: "ELIMINADO", id: PT_ID })
  })

  it("lanza 409 si el curso no es BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("ACTIVO"))

    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si hay entregas registradas", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.entregaProyecto.count.mockResolvedValue(3)

    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(null)

    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// AJUSTAR PESOS
// ─────────────────────────────────────────────────────────────────

describe("ajustarPesos", () => {
  const inputPesos: AjustarPesosProyectoTransversalInput = {
    pesoCapa1: 50,
    pesoCapa2: 30,
    pesoCapa3: 20,
  }

  it("actualiza pesos correctamente en BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.update.mockResolvedValue(
      buildPtRow({
        pesoCapa1: { toNumber: () => 50 },
        pesoCapa2: { toNumber: () => 30 },
        pesoCapa3: { toNumber: () => 20 },
      }),
    )
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(
      buildPtRow({ pesoCapa1: { toNumber: () => 50 } }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    await service.ajustarPesos(CURSO_ID, inputPesos, ACTOR_ID)
    expect(prisma.proyectoTransversal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pesoCapa1: 50, pesoCapa2: 30, pesoCapa3: 20 }),
      }),
    )
  })

  it("emite log CURSO_PESOS_RECALCULO_PENDIENTE en curso ACTIVO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("ACTIVO"))
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.update.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(buildPtRow())
    prisma.logActividad.create.mockResolvedValue({})

    await service.ajustarPesos(CURSO_ID, inputPesos, ACTOR_ID)

    const llamadas = prisma.logActividad.create.mock.calls as [{ data: { tipoAccion: string } }][]
    const tiposAccion = llamadas.map((c) => c[0].data.tipoAccion)
    expect(tiposAccion).toContain("CURSO_PESOS_RECALCULO_PENDIENTE")
    expect(tiposAccion).toContain("CURSO_ACTUALIZADO")
  })

  it("NO emite log RECALCULO_PENDIENTE en curso BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.update.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(buildPtRow())
    prisma.logActividad.create.mockResolvedValue({})

    await service.ajustarPesos(CURSO_ID, inputPesos, ACTOR_ID)

    const llamadas = prisma.logActividad.create.mock.calls as [{ data: { tipoAccion: string } }][]
    const tiposAccion = llamadas.map((c) => c[0].data.tipoAccion)
    expect(tiposAccion).not.toContain("CURSO_PESOS_RECALCULO_PENDIENTE")
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("CERRADO"))

    await expect(service.ajustarPesos(CURSO_ID, inputPesos, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(null)

    await expect(service.ajustarPesos(CURSO_ID, inputPesos, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  // Validación schema Zod
  it("schema rechaza pesos que no suman 100", () => {
    const { ajustarPesosProyectoTransversalInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        ajustarPesosProyectoTransversalInputSchema: typeof ajustarPesosProyectoTransversalInputSchema
      }
    const result = schema.safeParse({ pesoCapa1: 40, pesoCapa2: 30, pesoCapa3: 10 })
    expect(result.success).toBe(false)
  })

  it("schema acepta pesos que suman 100 exacto", () => {
    const { ajustarPesosProyectoTransversalInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        ajustarPesosProyectoTransversalInputSchema: typeof ajustarPesosProyectoTransversalInputSchema
      }
    const result = schema.safeParse({ pesoCapa1: 40, pesoCapa2: 30, pesoCapa3: 30 })
    expect(result.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// AJUSTAR UMBRAL
// ─────────────────────────────────────────────────────────────────

describe("ajustarUmbral", () => {
  const inputUmbral: AjustarUmbralProyectoTransversalInput = { umbralAprobacion: 80 }

  it("actualiza el umbralAprobacion del proyecto", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(buildPtRow())
    prisma.proyectoTransversal.update.mockResolvedValue(buildPtRow({ umbralAprobacion: 80 }))
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValue(
      buildPtRow({ umbralAprobacion: 80 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.ajustarUmbral(CURSO_ID, inputUmbral, ACTOR_ID)
    expect(result.umbralAprobacion).toBe(80)
    expect(prisma.proyectoTransversal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { umbralAprobacion: 80 } }),
    )
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow("CERRADO"))

    await expect(service.ajustarUmbral(CURSO_ID, inputUmbral, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCursoRow())
    prisma.proyectoTransversal.findUnique.mockResolvedValue(null)

    await expect(service.ajustarUmbral(CURSO_ID, inputUmbral, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})
