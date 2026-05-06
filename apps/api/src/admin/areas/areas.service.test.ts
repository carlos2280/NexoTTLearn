import { ConflictException, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { AreasService } from "./areas.service"

// PrismaMock minimo: solo lo que el service toca. Replicar la interfaz
// completa rompe al menor cambio en otros modelos y no aporta cobertura real.

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  area: {
    findUnique: Stub
    findMany: Stub
    count: Stub
    create: Stub
    update: Stub
    delete: Stub
  }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    area: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    logActividad: { create: vi.fn() },
    // Soporta ambas firmas: $transaction(callback) y $transaction([promesas]).
    // - Si recibe un callback, lo ejecuta pasando el mismo mock como tx, así
    //   los spies registran las llamadas dentro del callback.
    // - Si recibe un array, espera Promesas y devuelve el array de resultados
    //   (Prisma se comporta así para batch transactions).
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
  const service = new AreasService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const AREA_ID = "00000000-0000-0000-0000-000000000002"

function buildAreaRow(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date("2026-05-05T10:00:00Z")
  return {
    id: AREA_ID,
    nombre: "Frontend",
    color: "indigo",
    descripcion: null,
    orden: 0,
    estado: "ACTIVA" as const,
    obsoletaAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function buildAreaRowConCount(
  overrides: Partial<Record<string, unknown>> = {},
  counts = { cursoAreas: 0, modulos: 0 },
) {
  return { ...buildAreaRow(overrides), _count: counts }
}

describe("AreasService.crear", () => {
  let prisma: PrismaMock
  let service: AreasService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("happy path: crea area, emite AREA_CREADA y devuelve con _count", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(null) // no duplicado en BD
    const fila = buildAreaRow({ nombre: "Frontend" })
    prisma.area.create.mockResolvedValueOnce(fila)
    prisma.logActividad.create.mockResolvedValue({})
    // Re-lectura final con _count.
    prisma.area.findUnique.mockResolvedValueOnce({
      ...fila,
      _count: { cursoAreas: 0, modulos: 0 },
    })

    const result = await service.crear({ nombre: "Frontend", color: "indigo", orden: 0 }, ACTOR_ID)

    expect(result.id).toBe(AREA_ID)
    expect(result._count).toEqual({ cursoAreas: 0, modulos: 0 })
    expect(prisma.area.create).toHaveBeenCalledWith({
      data: {
        nombre: "Frontend",
        color: "indigo",
        descripcion: null,
        orden: 0,
      },
      select: expect.any(Object),
    })
    // Log emitido dentro de la transacción con tipoAccion correcto y snapshot.
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "AREA_CREADA",
        entidadTipo: "Area",
        entidadId: AREA_ID,
        valorAntes: Prisma.JsonNull,
        valorDespues: expect.objectContaining({ nombre: "Frontend" }),
      }),
    })
  })

  it("duplicado por nombre → 409 sin crear ni loguear", async () => {
    prisma.area.findUnique.mockResolvedValueOnce({ id: "otra-id" })

    await expect(
      service.crear({ nombre: "Frontend", color: "indigo", orden: 0 }, ACTOR_ID),
    ).rejects.toBeInstanceOf(ConflictException)

    expect(prisma.area.create).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })
})

describe("AreasService.actualizar", () => {
  let prisma: PrismaMock
  let service: AreasService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("id inexistente → 404", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(null)

    await expect(service.actualizar(AREA_ID, { nombre: "Nuevo" }, ACTOR_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )

    expect(prisma.area.update).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })

  it("happy path: aplica patch, emite AREA_ACTUALIZADA con valorAntes/Despues", async () => {
    const previo = buildAreaRow({ nombre: "Frontend", orden: 0 })
    const actualizado = buildAreaRow({ nombre: "Frontend Avanzado", orden: 1 })
    prisma.area.findUnique
      .mockResolvedValueOnce(previo) // findUnique inicial
      .mockResolvedValueOnce(null) // duplicado check del nombre nuevo
      .mockResolvedValueOnce({ ...actualizado, _count: { cursoAreas: 0, modulos: 0 } })
    prisma.area.update.mockResolvedValueOnce(actualizado)
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.actualizar(
      AREA_ID,
      { nombre: "Frontend Avanzado", orden: 1 },
      ACTOR_ID,
    )

    expect(result.nombre).toBe("Frontend Avanzado")
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "AREA_ACTUALIZADA",
        entidadTipo: "Area",
        entidadId: AREA_ID,
        valorAntes: expect.objectContaining({ nombre: "Frontend", orden: 0 }),
        valorDespues: expect.objectContaining({ nombre: "Frontend Avanzado", orden: 1 }),
      }),
    })
  })

  it("nombre duplicado en otra fila → 409", async () => {
    const previo = buildAreaRow({ nombre: "Frontend" })
    prisma.area.findUnique
      .mockResolvedValueOnce(previo)
      .mockResolvedValueOnce({ id: "otra-area-id" }) // duplicado check positivo

    await expect(
      service.actualizar(AREA_ID, { nombre: "Backend" }, ACTOR_ID),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.area.update).not.toHaveBeenCalled()
  })
})

describe("AreasService.eliminar", () => {
  let prisma: PrismaMock
  let service: AreasService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("con cursos referenciandola → soft delete (estado OBSOLETA, sin DELETE)", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(
      buildAreaRowConCount({ estado: "ACTIVA" }, { cursoAreas: 3, modulos: 2 }),
    )
    prisma.area.update.mockResolvedValueOnce(
      buildAreaRow({ estado: "OBSOLETA", obsoletaAt: new Date() }),
    )
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.eliminar(AREA_ID, ACTOR_ID)

    expect(result).toEqual({ tipo: "OBSOLETADA" })
    expect(prisma.area.delete).not.toHaveBeenCalled()
    expect(prisma.area.update).toHaveBeenCalledWith({
      where: { id: AREA_ID },
      data: { estado: "OBSOLETA", obsoletaAt: expect.any(Date) },
      select: expect.any(Object),
    })
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipoAccion: "AREA_OBSOLETADA",
        entidadTipo: "Area",
        entidadId: AREA_ID,
      }),
    })
  })

  it("sin referencias → hard delete + AREA_ELIMINADA", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(
      buildAreaRowConCount({ estado: "ACTIVA" }, { cursoAreas: 0, modulos: 0 }),
    )
    prisma.area.delete.mockResolvedValueOnce(buildAreaRow())
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.eliminar(AREA_ID, ACTOR_ID)

    expect(result).toEqual({ tipo: "ELIMINADA" })
    expect(prisma.area.delete).toHaveBeenCalledWith({ where: { id: AREA_ID } })
    expect(prisma.area.update).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipoAccion: "AREA_ELIMINADA",
        entidadTipo: "Area",
        entidadId: AREA_ID,
        valorDespues: Prisma.JsonNull,
      }),
    })
  })

  it("id inexistente → 404", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(null)
    await expect(service.eliminar(AREA_ID, ACTOR_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("AreasService.restaurar", () => {
  let prisma: PrismaMock
  let service: AreasService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("desde OBSOLETA → ACTIVA, limpia obsoletaAt y emite AREA_ACTUALIZADA con cambio de estado", async () => {
    const previo = buildAreaRow({
      estado: "OBSOLETA",
      obsoletaAt: new Date("2026-04-01T00:00:00Z"),
    })
    const restaurada = buildAreaRow({ estado: "ACTIVA", obsoletaAt: null })
    prisma.area.findUnique
      .mockResolvedValueOnce(previo)
      .mockResolvedValueOnce({ ...restaurada, _count: { cursoAreas: 1, modulos: 0 } })
    prisma.area.update.mockResolvedValueOnce(restaurada)
    prisma.logActividad.create.mockResolvedValue({})

    const result = await service.restaurar(AREA_ID, ACTOR_ID)

    expect(result.estado).toBe("ACTIVA")
    expect(prisma.area.update).toHaveBeenCalledWith({
      where: { id: AREA_ID },
      data: { estado: "ACTIVA", obsoletaAt: null },
      select: expect.any(Object),
    })
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "AREA_ACTUALIZADA",
        entidadTipo: "Area",
        entidadId: AREA_ID,
        valorAntes: expect.objectContaining({ estado: "OBSOLETA" }),
        valorDespues: expect.objectContaining({ estado: "ACTIVA", obsoletaAt: null }),
      }),
    })
  })

  it("desde ACTIVA → 409 (no aplica restaurar)", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(buildAreaRow({ estado: "ACTIVA" }))
    await expect(service.restaurar(AREA_ID, ACTOR_ID)).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.area.update).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })

  it("id inexistente → 404", async () => {
    prisma.area.findUnique.mockResolvedValueOnce(null)
    await expect(service.restaurar(AREA_ID, ACTOR_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("AreasService.listar", () => {
  let prisma: PrismaMock
  let service: AreasService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("default estado=ACTIVA, pagina 1 con pageSize 20, devuelve total", async () => {
    prisma.area.findMany.mockResolvedValueOnce([buildAreaRow(), buildAreaRow({ id: "otra" })])
    prisma.area.count.mockResolvedValueOnce(2)

    const result = await service.listar({ page: 1, pageSize: 20 })

    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(2)
    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { estado: "ACTIVA" },
        skip: 0,
        take: 20,
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      }),
    )
  })

  it("filtro por q aplica contains case-insensitive", async () => {
    prisma.area.findMany.mockResolvedValueOnce([])
    prisma.area.count.mockResolvedValueOnce(0)

    await service.listar({ q: "front", page: 1, pageSize: 20 })

    expect(prisma.area.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { estado: "ACTIVA", nombre: { contains: "front", mode: "insensitive" } },
      }),
    )
  })
})
