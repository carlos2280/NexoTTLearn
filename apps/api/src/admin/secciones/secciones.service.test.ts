import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { SeccionesService } from "./secciones.service"

// Builder de un PrismaService mockeado con stubs por defecto. Cada test
// sobreescribe los metodos que necesite. Devolver siempre la misma forma de
// objeto facilita los asserts (encontrar/no encontrar).
type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  modulo: { findFirst: Stub }
  seccion: {
    findMany: Stub
    findFirst: Stub
    aggregate: Stub
    create: Stub
    update: Stub
    delete: Stub
  }
  entrega: { count: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    modulo: { findFirst: vi.fn() },
    seccion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    entrega: { count: vi.fn().mockResolvedValue(0) },
    $transaction: vi.fn(),
  }
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  // Cast `as never` evita reescribir la interfaz completa de PrismaService
  // (decenas de modelos) solo para tests. El service solo toca los metodos
  // mockeados arriba.
  const service = new SeccionesService(prisma as never as PrismaService)
  return { service, prisma }
}

// Filas Prisma de referencia. Devolverlas listas-para-mapper en cada test
// hace que los asserts del shape sean explicitos.
const FECHA = new Date("2026-01-15T12:00:00.000Z")
const FECHA_ISO = FECHA.toISOString()

function buildSeccionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sec-1",
    moduloId: "mod-1",
    titulo: "Introduccion",
    orden: 1,
    creadoEn: FECHA,
    actualizadoEn: FECHA,
    contenidos: [],
    ...overrides,
  }
}

describe("SeccionesService.obtenerSecciones", () => {
  it("devuelve items mapeados con contenidos ordenados", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findMany.mockResolvedValue([
      buildSeccionRow({
        contenidos: [
          {
            id: "cont-1",
            seccionId: "sec-1",
            tipo: "LECTURA",
            titulo: "Conceptos",
            orden: 1,
            metadata: { duracionEstimada: 10, nivel: "basico" },
            archivado: false,
            creadoEn: FECHA,
            actualizadoEn: FECHA,
          },
        ],
      }),
    ])

    const result = await service.obtenerSecciones("curso-1", "mod-1")

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: "sec-1",
      titulo: "Introduccion",
      orden: 1,
      creadoEn: FECHA_ISO,
    })
    const primerContenido = result.items[0]?.contenidos[0]
    expect(primerContenido).toMatchObject({
      id: "cont-1",
      tipo: "LECTURA",
      duracionEstimada: 10,
      metadata: { duracionEstimada: 10, nivel: "basico" },
    })
  })

  it("devuelve duracionEstimada=null cuando metadata no tiene el campo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findMany.mockResolvedValue([
      buildSeccionRow({
        contenidos: [
          {
            id: "cont-1",
            seccionId: "sec-1",
            tipo: "RECURSO",
            titulo: "PDF",
            orden: 1,
            metadata: null,
            archivado: false,
            creadoEn: FECHA,
            actualizadoEn: FECHA,
          },
        ],
      }),
    ])

    const result = await service.obtenerSecciones("curso-1", "mod-1")
    const primerContenido = result.items[0]?.contenidos[0]
    expect(primerContenido?.duracionEstimada).toBeNull()
    expect(primerContenido?.metadata).toBeNull()
  })

  it("404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.obtenerSecciones("curso-X", "mod-1")).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("404 si el modulo no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue(null)

    await expect(service.obtenerSecciones("curso-1", "mod-otro")).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})

describe("SeccionesService.crearSeccion", () => {
  it("asigna orden = max+1 al crear", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.aggregate.mockResolvedValue({ _max: { orden: 3 } })
    prisma.seccion.create.mockResolvedValue(buildSeccionRow({ orden: 4, titulo: "Nueva" }))

    const result = await service.crearSeccion("curso-1", "mod-1", { titulo: "Nueva" })

    expect(prisma.seccion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { moduloId: "mod-1", titulo: "Nueva", orden: 4 },
      }),
    )
    expect(result.orden).toBe(4)
  })

  it("asigna orden = 1 cuando es la primera seccion", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.aggregate.mockResolvedValue({ _max: { orden: null } })
    prisma.seccion.create.mockResolvedValue(buildSeccionRow({ orden: 1 }))

    await service.crearSeccion("curso-1", "mod-1", { titulo: "Primera" })

    expect(prisma.seccion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 1 }) }),
    )
  })

  it("404 si el modulo no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue(null)

    await expect(
      service.crearSeccion("curso-1", "mod-otro", { titulo: "X" }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.seccion.create).not.toHaveBeenCalled()
  })
})

describe("SeccionesService.actualizarSeccion", () => {
  it("actualiza solo el titulo cuando es el unico campo enviado", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue({ id: "sec-1" })
    prisma.seccion.update.mockResolvedValue(buildSeccionRow({ titulo: "Renombrada" }))

    const result = await service.actualizarSeccion("curso-1", "mod-1", "sec-1", {
      titulo: "Renombrada",
    })

    expect(prisma.seccion.update).toHaveBeenCalledWith({
      where: { id: "sec-1" },
      data: { titulo: "Renombrada" },
      select: expect.any(Object),
    })
    expect(result.titulo).toBe("Renombrada")
  })

  it("PATCH vacio no envia campos definidos (data: { titulo: undefined })", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue({ id: "sec-1" })
    prisma.seccion.update.mockResolvedValue(buildSeccionRow())

    await service.actualizarSeccion("curso-1", "mod-1", "sec-1", {})

    // Prisma trata undefined como "no tocar" — es el comportamiento esperado.
    expect(prisma.seccion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { titulo: undefined } }),
    )
  })

  it("404 si la seccion no pertenece al modulo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue(null)

    await expect(
      service.actualizarSeccion("curso-1", "mod-1", "sec-otra", { titulo: "X" }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.seccion.update).not.toHaveBeenCalled()
  })
})

describe("SeccionesService.eliminarSeccion", () => {
  it("borra y devuelve { ok: true } en happy path", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue({ id: "sec-1" })
    prisma.seccion.delete.mockResolvedValue({ id: "sec-1" })

    const result = await service.eliminarSeccion("curso-1", "mod-1", "sec-1")

    expect(prisma.seccion.delete).toHaveBeenCalledWith({ where: { id: "sec-1" } })
    expect(result).toEqual({ ok: true })
  })

  it("404 si la seccion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue(null)

    await expect(service.eliminarSeccion("curso-1", "mod-1", "sec-X")).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(prisma.seccion.delete).not.toHaveBeenCalled()
  })

  it("Conflict cuando algun contenido de la seccion tiene entregas", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue({ id: "sec-1" })
    prisma.entrega.count.mockResolvedValue(5)

    let capturado: ConflictException | undefined
    try {
      await service.eliminarSeccion("curso-1", "mod-1", "sec-1")
    } catch (e) {
      capturado = e as ConflictException
    }
    expect(capturado).toBeInstanceOf(ConflictException)
    expect(capturado?.message).toContain("5")
    expect(prisma.seccion.delete).not.toHaveBeenCalled()
  })
})

describe("SeccionesService.reordenarSecciones", () => {
  function setupOk(prisma: PrismaMock, ids: string[]) {
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findMany.mockResolvedValueOnce(ids.map((id) => ({ id })))
    // Pasada de re-lectura tras el reorder (la usa obtenerSecciones).
    prisma.seccion.findMany.mockResolvedValueOnce([])
    // $transaction recibe un callback (tx) => Promise. Resolverlo basta con
    // pasarle un tx mock que reuse seccion.update y trackear las llamadas.
    prisma.$transaction.mockImplementation((fn: (tx: PrismaMock) => Promise<unknown>) => fn(prisma))
    prisma.seccion.update.mockResolvedValue({ id: "ok" })
  }

  it("ejecuta dos pasadas: orden negativo y luego definitivo", async () => {
    const { service, prisma } = buildService()
    setupOk(prisma, ["sec-1", "sec-2", "sec-3"])

    await service.reordenarSecciones("curso-1", "mod-1", {
      ids: ["sec-3", "sec-1", "sec-2"],
    })

    // 3 ids x 2 pasadas = 6 updates. Los primeros 3 con orden negativo, los
    // ultimos 3 con orden positivo definitivo.
    expect(prisma.seccion.update).toHaveBeenCalledTimes(6)
    const calls = prisma.seccion.update.mock.calls.map((c) => c[0])
    expect(calls[0]).toEqual({ where: { id: "sec-3" }, data: { orden: -1 } })
    expect(calls[1]).toEqual({ where: { id: "sec-1" }, data: { orden: -2 } })
    expect(calls[2]).toEqual({ where: { id: "sec-2" }, data: { orden: -3 } })
    expect(calls[3]).toEqual({ where: { id: "sec-3" }, data: { orden: 1 } })
    expect(calls[4]).toEqual({ where: { id: "sec-1" }, data: { orden: 2 } })
    expect(calls[5]).toEqual({ where: { id: "sec-2" }, data: { orden: 3 } })
  })

  it("400 si la longitud de ids no coincide", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findMany.mockResolvedValue([{ id: "sec-1" }, { id: "sec-2" }])

    await expect(
      service.reordenarSecciones("curso-1", "mod-1", { ids: ["sec-1"] }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("400 si hay ids duplicados en la lista recibida", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findMany.mockResolvedValue([{ id: "sec-1" }, { id: "sec-2" }])

    await expect(
      service.reordenarSecciones("curso-1", "mod-1", { ids: ["sec-1", "sec-1"] }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("400 si un id no pertenece al modulo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findMany.mockResolvedValue([{ id: "sec-1" }, { id: "sec-2" }])

    await expect(
      service.reordenarSecciones("curso-1", "mod-1", { ids: ["sec-1", "sec-X"] }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("404 si el modulo no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue(null)

    await expect(
      service.reordenarSecciones("curso-1", "mod-X", { ids: ["sec-1"] }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
