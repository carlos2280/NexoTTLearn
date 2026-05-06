import { ConflictException, NotFoundException } from "@nestjs/common"
import type {
  AjustarPesosMiniProyectoInput,
  AjustarUmbralMiniProyectoInput,
  UpsertMiniProyectoAdminInput,
  ajustarPesosMiniProyectoInputSchema,
} from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosMiniProyectoService } from "./cursos-miniproyecto.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  modulo: { findUnique: Stub; update: Stub }
  miniProyecto: {
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
    modulo: { findUnique: vi.fn(), update: vi.fn() },
    miniProyecto: {
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
  const service = new CursosMiniProyectoService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const MODULO_ID = "00000000-0000-0000-0000-000000000003"
const MINI_ID = "00000000-0000-0000-0000-000000000004"

const NOW = new Date("2026-05-06T10:00:00Z")

function buildModuloRow(
  overrides: Partial<{
    cursoId: string
    archivadoAt: Date | null
    miniProyectoActivo: boolean
    umbralMiniOverride: number | null
    curso: { id: string; estado: "BORRADOR" | "ACTIVO" | "CERRADO" }
  }> = {},
) {
  return {
    id: MODULO_ID,
    cursoId: overrides.cursoId ?? CURSO_ID,
    miniProyectoActivo: overrides.miniProyectoActivo ?? false,
    umbralMiniOverride: overrides.umbralMiniOverride ?? null,
    archivadoAt: overrides.archivadoAt ?? null,
    curso: overrides.curso ?? { id: CURSO_ID, estado: "BORRADOR" as const },
  }
}

function buildMiniRow(
  overrides: Partial<{
    id: string
    titulo: string
    enunciado: string
    pesoCapa1: unknown
    pesoCapa2: unknown
    pesoCapa3: unknown
    umbralMiniOverride: number | null
  }> = {},
) {
  return {
    id: overrides.id ?? MINI_ID,
    moduloId: MODULO_ID,
    titulo: overrides.titulo ?? "Mini Proyecto",
    enunciado: overrides.enunciado ?? "Enunciado de prueba",
    pesoCapa1: overrides.pesoCapa1 ?? { toNumber: () => 40 },
    pesoCapa2: overrides.pesoCapa2 ?? { toNumber: () => 30 },
    pesoCapa3: overrides.pesoCapa3 ?? { toNumber: () => 30 },
    createdAt: NOW,
    updatedAt: NOW,
    modulo: { umbralMiniOverride: overrides.umbralMiniOverride ?? null },
  }
}

// ─────────────────────────────────────────────────────────────────
// OBTENER
// ─────────────────────────────────────────────────────────────────

describe("obtener", () => {
  it("devuelve el mini proyecto cuando existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())

    const result = await service.obtener(CURSO_ID, MODULO_ID)
    expect(result.id).toBe(MINI_ID)
    expect(result.moduloId).toBe(MODULO_ID)
  })

  it("lanza 404 si el modulo no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(null)

    await expect(service.obtener(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si el mini proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(null)

    await expect(service.obtener(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// UPSERT
// ─────────────────────────────────────────────────────────────────

describe("upsert", () => {
  const input: UpsertMiniProyectoAdminInput = {
    titulo: "Mini Proyecto Final",
    enunciado: "Desarrolla una API REST",
  }

  it("crea el mini proyecto si no existe y activa el flag del modulo", async () => {
    const { service, prisma } = buildService()
    const modulo = buildModuloRow({ miniProyectoActivo: false })
    prisma.modulo.findUnique.mockResolvedValue(modulo)
    prisma.miniProyecto.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue(buildMiniRow({ titulo: input.titulo }))
    prisma.miniProyecto.create.mockResolvedValue(buildMiniRow({ titulo: input.titulo }))
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(buildMiniRow({ titulo: input.titulo }))
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.update.mockResolvedValue({})

    const result = await service.upsert(CURSO_ID, MODULO_ID, input, ACTOR_ID)
    expect(result.titulo).toBe(input.titulo)
    expect(prisma.miniProyecto.create).toHaveBeenCalled()
    expect(prisma.modulo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ miniProyectoActivo: true }) }),
    )
  })

  it("actualiza el mini proyecto si ya existe", async () => {
    const { service, prisma } = buildService()
    const modulo = buildModuloRow({ miniProyectoActivo: true })
    const existente = buildMiniRow({ titulo: "Titulo viejo" })
    prisma.modulo.findUnique.mockResolvedValue(modulo)
    prisma.miniProyecto.findUnique.mockResolvedValue(existente)
    prisma.miniProyecto.update.mockResolvedValue(buildMiniRow({ titulo: input.titulo }))
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(buildMiniRow({ titulo: input.titulo }))
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.upsert(CURSO_ID, MODULO_ID, input, ACTOR_ID)
    expect(result.titulo).toBe(input.titulo)
    expect(prisma.miniProyecto.update).toHaveBeenCalled()
    expect(prisma.miniProyecto.create).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ curso: { id: CURSO_ID, estado: "CERRADO" } }),
    )

    await expect(service.upsert(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el modulo no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(null)

    await expect(service.upsert(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR (PATCH)
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza titulo correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.miniProyecto.update.mockResolvedValue(buildMiniRow({ titulo: "Nuevo titulo" }))
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(
      buildMiniRow({ titulo: "Nuevo titulo" }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.actualizar(
      CURSO_ID,
      MODULO_ID,
      { titulo: "Nuevo titulo" },
      ACTOR_ID,
    )
    expect(result.titulo).toBe("Nuevo titulo")
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ curso: { id: CURSO_ID, estado: "CERRADO" } }),
    )

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, { titulo: "X" }, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el mini proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(null)

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, { titulo: "X" }, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina el mini proyecto en curso BORRADOR sin entregas", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.entregaProyecto.count.mockResolvedValue(0)
    prisma.miniProyecto.delete.mockResolvedValue({})
    prisma.modulo.update.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)
    expect(result).toEqual({ tipo: "ELIMINADO", id: MINI_ID })
  })

  it("lanza 409 si el curso no es BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ curso: { id: CURSO_ID, estado: "ACTIVO" } }),
    )

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si hay entregas registradas", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.entregaProyecto.count.mockResolvedValue(2)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el mini proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(null)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// AJUSTAR PESOS
// ─────────────────────────────────────────────────────────────────

describe("ajustarPesos", () => {
  const inputPesos: AjustarPesosMiniProyectoInput = {
    pesoCapa1: 50,
    pesoCapa2: 30,
    pesoCapa3: 20,
  }

  it("actualiza pesos correctamente en BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.miniProyecto.update.mockResolvedValue(
      buildMiniRow({
        pesoCapa1: { toNumber: () => 50 },
        pesoCapa2: { toNumber: () => 30 },
        pesoCapa3: { toNumber: () => 20 },
      }),
    )
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(
      buildMiniRow({ pesoCapa1: { toNumber: () => 50 } }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    await service.ajustarPesos(CURSO_ID, MODULO_ID, inputPesos, ACTOR_ID)
    expect(prisma.miniProyecto.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pesoCapa1: 50, pesoCapa2: 30, pesoCapa3: 20 }),
      }),
    )
  })

  it("emite log CURSO_PESOS_RECALCULO_PENDIENTE en curso ACTIVO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ curso: { id: CURSO_ID, estado: "ACTIVO" } }),
    )
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.miniProyecto.update.mockResolvedValue(buildMiniRow())
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(buildMiniRow())
    prisma.logActividad.create.mockResolvedValue({})

    await service.ajustarPesos(CURSO_ID, MODULO_ID, inputPesos, ACTOR_ID)

    const llamadas = prisma.logActividad.create.mock.calls as [{ data: { tipoAccion: string } }][]
    const tiposAccion = llamadas.map((c) => c[0].data.tipoAccion)
    expect(tiposAccion).toContain("CURSO_PESOS_RECALCULO_PENDIENTE")
    expect(tiposAccion).toContain("CURSO_ACTUALIZADO")
  })

  it("NO emite log RECALCULO_PENDIENTE en curso BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.miniProyecto.update.mockResolvedValue(buildMiniRow())
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(buildMiniRow())
    prisma.logActividad.create.mockResolvedValue({})

    await service.ajustarPesos(CURSO_ID, MODULO_ID, inputPesos, ACTOR_ID)

    const llamadas = prisma.logActividad.create.mock.calls as [{ data: { tipoAccion: string } }][]
    const tiposAccion = llamadas.map((c) => c[0].data.tipoAccion)
    expect(tiposAccion).not.toContain("CURSO_PESOS_RECALCULO_PENDIENTE")
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ curso: { id: CURSO_ID, estado: "CERRADO" } }),
    )

    await expect(service.ajustarPesos(CURSO_ID, MODULO_ID, inputPesos, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el mini proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(null)

    await expect(service.ajustarPesos(CURSO_ID, MODULO_ID, inputPesos, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  // Validación schema Zod
  it("schema rechaza pesos que no suman 100", () => {
    const { ajustarPesosMiniProyectoInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        ajustarPesosMiniProyectoInputSchema: typeof ajustarPesosMiniProyectoInputSchema
      }
    const result = schema.safeParse({ pesoCapa1: 40, pesoCapa2: 30, pesoCapa3: 10 })
    expect(result.success).toBe(false)
  })

  it("schema acepta pesos que suman 100 exacto", () => {
    const { ajustarPesosMiniProyectoInputSchema: schema } =
      require("@nexott-learn/shared-types") as {
        ajustarPesosMiniProyectoInputSchema: typeof ajustarPesosMiniProyectoInputSchema
      }
    const result = schema.safeParse({ pesoCapa1: 40, pesoCapa2: 30, pesoCapa3: 30 })
    expect(result.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// AJUSTAR UMBRAL
// ─────────────────────────────────────────────────────────────────

describe("ajustarUmbral", () => {
  const inputUmbral: AjustarUmbralMiniProyectoInput = { umbralMiniOverride: 80 }

  it("actualiza el umbralMiniOverride del modulo", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow())
    prisma.modulo.update.mockResolvedValue({})
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(
      buildMiniRow({ umbralMiniOverride: 80 }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.ajustarUmbral(CURSO_ID, MODULO_ID, inputUmbral, ACTOR_ID)
    expect(result.umbralMiniOverride).toBe(80)
    expect(prisma.modulo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { umbralMiniOverride: 80 } }),
    )
  })

  it("acepta umbralMiniOverride: null (reset a heredar del area)", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow({ umbralMiniOverride: 80 }))
    prisma.miniProyecto.findUnique.mockResolvedValue(buildMiniRow({ umbralMiniOverride: 80 }))
    prisma.modulo.update.mockResolvedValue({})
    prisma.miniProyecto.findUniqueOrThrow.mockResolvedValue(
      buildMiniRow({ umbralMiniOverride: null }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.ajustarUmbral(
      CURSO_ID,
      MODULO_ID,
      { umbralMiniOverride: null },
      ACTOR_ID,
    )
    expect(result.umbralMiniOverride).toBeNull()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ curso: { id: CURSO_ID, estado: "CERRADO" } }),
    )

    await expect(service.ajustarUmbral(CURSO_ID, MODULO_ID, inputUmbral, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el mini proyecto no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.miniProyecto.findUnique.mockResolvedValue(null)

    await expect(service.ajustarUmbral(CURSO_ID, MODULO_ID, inputUmbral, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})
