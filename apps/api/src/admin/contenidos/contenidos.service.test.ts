import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { ContenidosService } from "./contenidos.service"

// Builder de un PrismaService mockeado con stubs por defecto. Cada test
// sobreescribe los metodos que necesite.
type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  modulo: { findFirst: Stub }
  seccion: { findFirst: Stub }
  contenido: {
    findMany: Stub
    findFirst: Stub
    findUniqueOrThrow: Stub
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
    seccion: { findFirst: vi.fn() },
    contenido: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    entrega: { count: vi.fn() },
    $transaction: vi.fn(),
  }
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  // Cast `as never` evita reescribir la interfaz completa de PrismaService.
  const service = new ContenidosService(prisma as never as PrismaService)
  return { service, prisma }
}

// Helper: stubea curso/modulo/seccion como existentes y pertenecientes.
function setupAccesoOk(prisma: PrismaMock) {
  prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
  prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
  prisma.seccion.findFirst.mockResolvedValue({ id: "sec-1" })
}

const FECHA = new Date("2026-01-15T12:00:00.000Z")
const FECHA_ISO = FECHA.toISOString()

function buildContenidoRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cont-1",
    seccionId: "sec-1",
    tipo: "LECTURA",
    titulo: "Conceptos",
    orden: 1,
    contenido: { cuerpo: "<p>hola</p>" },
    metadata: { duracionEstimada: 10 },
    archivado: false,
    creadoEn: FECHA,
    actualizadoEn: FECHA,
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────
// obtenerContenidos
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.obtenerContenidos", () => {
  it("filtra archivados=false por defecto y ordena ascendente", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findMany.mockResolvedValue([buildContenidoRow()])

    const result = await service.obtenerContenidos("curso-1", "mod-1", "sec-1", false)

    expect(prisma.contenido.findMany).toHaveBeenCalledWith({
      where: { seccionId: "sec-1", archivado: false },
      orderBy: { orden: "asc" },
      select: expect.any(Object),
    })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: "cont-1",
      tipo: "LECTURA",
      contenido: { cuerpo: "<p>hola</p>" },
      creadoEn: FECHA_ISO,
    })
  })

  it("incluye archivados cuando incluirArchivados=true", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findMany.mockResolvedValue([])

    await service.obtenerContenidos("curso-1", "mod-1", "sec-1", true)

    expect(prisma.contenido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { seccionId: "sec-1" } }),
    )
  })

  it("404 si la seccion no pertenece al modulo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue(null)

    await expect(
      service.obtenerContenidos("curso-1", "mod-1", "sec-X", false),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// obtenerContenido
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.obtenerContenido", () => {
  it("404 si el contenido no existe", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue(null)

    await expect(
      service.obtenerContenido("curso-1", "mod-1", "sec-1", "cont-X"),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("404 si el contenidoId no pertenece a la seccion del path", async () => {
    // El service busca con findFirst({ id, seccionId }), asi que un id que
    // existe en otra seccion se trata igual que inexistente: devuelve null.
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue(null)

    await expect(
      service.obtenerContenido("curso-1", "mod-1", "sec-1", "cont-otra-seccion"),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.contenido.findFirst).toHaveBeenCalledWith({
      where: { id: "cont-otra-seccion", seccionId: "sec-1" },
      select: expect.any(Object),
    })
  })

  it("devuelve item mapeado con payload completo", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue(buildContenidoRow())

    const result = await service.obtenerContenido("curso-1", "mod-1", "sec-1", "cont-1")

    expect(result).toMatchObject({
      id: "cont-1",
      tipo: "LECTURA",
      contenido: { cuerpo: "<p>hola</p>" },
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// crearContenido
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.crearContenido", () => {
  it("aplica defaults LECTURA cuando no llega payload", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.aggregate.mockResolvedValue({ _max: { orden: 2 } })
    prisma.contenido.create.mockResolvedValue(buildContenidoRow({ orden: 3 }))

    await service.crearContenido("curso-1", "mod-1", "sec-1", {
      tipo: "LECTURA",
      titulo: "Bloque vacio",
    })

    const arg = prisma.contenido.create.mock.calls[0]![0]
    expect(arg.data.tipo).toBe("LECTURA")
    expect(arg.data.titulo).toBe("Bloque vacio")
    expect(arg.data.orden).toBe(3)
    expect(arg.data.contenido).toEqual({ cuerpo: "" })
  })

  it("aplica defaults EJERCICIO modo guiado cuando no llega payload", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.aggregate.mockResolvedValue({ _max: { orden: null } })
    prisma.contenido.create.mockResolvedValue(buildContenidoRow({ tipo: "EJERCICIO", orden: 1 }))

    await service.crearContenido("curso-1", "mod-1", "sec-1", {
      tipo: "EJERCICIO",
      titulo: "Reto 1",
    })

    const arg = prisma.contenido.create.mock.calls[0]![0]
    expect(arg.data.orden).toBe(1)
    expect(arg.data.contenido).toMatchObject({
      modo: "guiado",
      lenguaje: "javascript",
      archivosIniciales: [],
      tests: [],
    })
  })

  it("guarda el payload tal cual cuando llega valido", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.aggregate.mockResolvedValue({ _max: { orden: 0 } })
    prisma.contenido.create.mockResolvedValue(buildContenidoRow({ orden: 1 }))

    const payload = { cuerpo: "<p>Texto</p>" }
    await service.crearContenido("curso-1", "mod-1", "sec-1", {
      tipo: "LECTURA",
      titulo: "Lectura",
      contenido: payload,
    })

    const arg = prisma.contenido.create.mock.calls[0]![0]
    expect(arg.data.contenido).toEqual(payload)
  })

  it("BadRequest si el payload no valida contra el schema del tipo", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.aggregate.mockResolvedValue({ _max: { orden: 0 } })

    await expect(
      service.crearContenido("curso-1", "mod-1", "sec-1", {
        tipo: "VIDEO",
        titulo: "Mal video",
        // proveedor faltante — el schema VIDEO lo exige
        contenido: { url: "https://x" },
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.contenido.create).not.toHaveBeenCalled()
  })

  it("orden = max+1", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.aggregate.mockResolvedValue({ _max: { orden: 7 } })
    prisma.contenido.create.mockResolvedValue(buildContenidoRow({ orden: 8 }))

    await service.crearContenido("curso-1", "mod-1", "sec-1", {
      tipo: "LECTURA",
      titulo: "Otro",
    })

    expect(prisma.contenido.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 8 }) }),
    )
  })

  it("404 si la seccion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: "curso-1" })
    prisma.modulo.findFirst.mockResolvedValue({ id: "mod-1" })
    prisma.seccion.findFirst.mockResolvedValue(null)

    await expect(
      service.crearContenido("curso-1", "mod-1", "sec-X", {
        tipo: "LECTURA",
        titulo: "X",
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.contenido.create).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────
// actualizarContenido
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.actualizarContenido", () => {
  it("actualiza solo titulo cuando es el unico campo", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", tipo: "LECTURA" })
    prisma.contenido.update.mockResolvedValue(buildContenidoRow({ titulo: "Renombrada" }))

    await service.actualizarContenido("curso-1", "mod-1", "sec-1", "cont-1", {
      titulo: "Renombrada",
    })

    expect(prisma.contenido.update).toHaveBeenCalledWith({
      where: { id: "cont-1" },
      data: { titulo: "Renombrada", contenido: undefined },
      select: expect.any(Object),
    })
  })

  it("actualiza el contenido validandolo contra el schema del tipo actual", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", tipo: "LECTURA" })
    prisma.contenido.update.mockResolvedValue(buildContenidoRow())

    await service.actualizarContenido("curso-1", "mod-1", "sec-1", "cont-1", {
      contenido: { cuerpo: "nuevo" },
    })

    const arg = prisma.contenido.update.mock.calls[0]![0]
    expect(arg.data.contenido).toEqual({ cuerpo: "nuevo" })
  })

  it("BadRequest si el contenido enviado no valida contra el tipo actual", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", tipo: "LECTURA" })

    await expect(
      service.actualizarContenido("curso-1", "mod-1", "sec-1", "cont-1", {
        // payload de VIDEO sobre un LECTURA: no valida
        contenido: { url: "x", proveedor: "youtube" },
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.contenido.update).not.toHaveBeenCalled()
  })

  it("BadRequest si llega `tipo` en el input (defensa en profundidad)", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", tipo: "LECTURA" })

    await expect(
      service.actualizarContenido("curso-1", "mod-1", "sec-1", "cont-1", {
        // bypass del Zod del controller: alguien llamando al service directo
        tipo: "VIDEO",
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.contenido.update).not.toHaveBeenCalled()
  })

  it("404 si el contenido no existe", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue(null)

    await expect(
      service.actualizarContenido("curso-1", "mod-1", "sec-1", "cont-X", {
        titulo: "x",
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("metadata=null limpia el campo", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", tipo: "LECTURA" })
    prisma.contenido.update.mockResolvedValue(buildContenidoRow({ metadata: null }))

    await service.actualizarContenido("curso-1", "mod-1", "sec-1", "cont-1", {
      metadata: null,
    })

    const arg = prisma.contenido.update.mock.calls[0]![0]
    // Prisma.JsonNull es un simbolo runtime; testeamos que no sea undefined.
    expect(arg.data.metadata).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────
// reordenarContenidos
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.reordenarContenidos", () => {
  function setupReorderOk(prisma: PrismaMock, ids: string[]) {
    setupAccesoOk(prisma)
    prisma.contenido.findMany.mockResolvedValueOnce(ids.map((id) => ({ id })))
    // Re-lectura tras reorder (la usa obtenerContenidos al final).
    prisma.contenido.findMany.mockResolvedValueOnce([])
    prisma.$transaction.mockImplementation((fn: (tx: PrismaMock) => Promise<unknown>) => fn(prisma))
    prisma.contenido.update.mockResolvedValue({ id: "ok" })
  }

  it("ejecuta dos pasadas: orden negativo y luego definitivo", async () => {
    const { service, prisma } = buildService()
    setupReorderOk(prisma, ["cont-1", "cont-2", "cont-3"])

    await service.reordenarContenidos("curso-1", "mod-1", "sec-1", {
      ordenes: [
        { id: "cont-3", orden: 1 },
        { id: "cont-1", orden: 2 },
        { id: "cont-2", orden: 3 },
      ],
    })

    expect(prisma.contenido.update).toHaveBeenCalledTimes(6)
    const calls = prisma.contenido.update.mock.calls.map((c) => c[0])
    // Pasada 1: negativos por indice de la lista enviada
    expect(calls[0]).toEqual({ where: { id: "cont-3" }, data: { orden: -1 } })
    expect(calls[1]).toEqual({ where: { id: "cont-1" }, data: { orden: -2 } })
    expect(calls[2]).toEqual({ where: { id: "cont-2" }, data: { orden: -3 } })
    // Pasada 2: el orden definitivo que envia el cliente
    expect(calls[3]).toEqual({ where: { id: "cont-3" }, data: { orden: 1 } })
    expect(calls[4]).toEqual({ where: { id: "cont-1" }, data: { orden: 2 } })
    expect(calls[5]).toEqual({ where: { id: "cont-2" }, data: { orden: 3 } })
  })

  it("400 si la longitud de ordenes no coincide con los existentes", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findMany.mockResolvedValue([{ id: "cont-1" }, { id: "cont-2" }])

    await expect(
      service.reordenarContenidos("curso-1", "mod-1", "sec-1", {
        ordenes: [{ id: "cont-1", orden: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("400 si hay ids duplicados", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findMany.mockResolvedValue([{ id: "cont-1" }, { id: "cont-2" }])

    await expect(
      service.reordenarContenidos("curso-1", "mod-1", "sec-1", {
        ordenes: [
          { id: "cont-1", orden: 1 },
          { id: "cont-1", orden: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("400 si un id no pertenece a la seccion", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findMany.mockResolvedValue([{ id: "cont-1" }, { id: "cont-2" }])

    await expect(
      service.reordenarContenidos("curso-1", "mod-1", "sec-1", {
        ordenes: [
          { id: "cont-1", orden: 1 },
          { id: "cont-X", orden: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────
// eliminarContenido
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.eliminarContenido", () => {
  it("borra cuando no hay entregas", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1" })
    prisma.entrega.count.mockResolvedValue(0)
    prisma.contenido.delete.mockResolvedValue({ id: "cont-1" })

    await service.eliminarContenido("curso-1", "mod-1", "sec-1", "cont-1")

    expect(prisma.contenido.delete).toHaveBeenCalledWith({ where: { id: "cont-1" } })
  })

  it("Conflict cuando hay N entregas y N aparece en el mensaje", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1" })
    prisma.entrega.count.mockResolvedValue(3)

    let capturado: ConflictException | undefined
    try {
      await service.eliminarContenido("curso-1", "mod-1", "sec-1", "cont-1")
    } catch (e) {
      capturado = e as ConflictException
    }
    expect(capturado).toBeInstanceOf(ConflictException)
    expect(capturado?.message).toContain("3")
    expect(prisma.contenido.delete).not.toHaveBeenCalled()
  })

  it("404 si el contenido no existe", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue(null)

    await expect(
      service.eliminarContenido("curso-1", "mod-1", "sec-1", "cont-X"),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.entrega.count).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────
// archivarContenido / restaurarContenido
// ─────────────────────────────────────────────────────────────────

describe("ContenidosService.archivarContenido", () => {
  it("pone archivado=true cuando estaba en false", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", archivado: false })
    prisma.contenido.update.mockResolvedValue(buildContenidoRow({ archivado: true }))

    const result = await service.archivarContenido("curso-1", "mod-1", "sec-1", "cont-1")

    expect(prisma.contenido.update).toHaveBeenCalledWith({
      where: { id: "cont-1" },
      data: { archivado: true },
      select: expect.any(Object),
    })
    expect(result.archivado).toBe(true)
  })

  it("idempotente: si ya esta archivado, no llama a update", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", archivado: true })
    prisma.contenido.findUniqueOrThrow.mockResolvedValue(buildContenidoRow({ archivado: true }))

    const result = await service.archivarContenido("curso-1", "mod-1", "sec-1", "cont-1")

    expect(prisma.contenido.update).not.toHaveBeenCalled()
    expect(result.archivado).toBe(true)
  })

  it("404 si el contenido no existe", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue(null)

    await expect(
      service.archivarContenido("curso-1", "mod-1", "sec-1", "cont-X"),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("ContenidosService.restaurarContenido", () => {
  it("pone archivado=false cuando estaba en true", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", archivado: true })
    prisma.contenido.update.mockResolvedValue(buildContenidoRow({ archivado: false }))

    const result = await service.restaurarContenido("curso-1", "mod-1", "sec-1", "cont-1")

    expect(prisma.contenido.update).toHaveBeenCalledWith({
      where: { id: "cont-1" },
      data: { archivado: false },
      select: expect.any(Object),
    })
    expect(result.archivado).toBe(false)
  })

  it("idempotente: si ya esta restaurado, no llama a update", async () => {
    const { service, prisma } = buildService()
    setupAccesoOk(prisma)
    prisma.contenido.findFirst.mockResolvedValue({ id: "cont-1", archivado: false })
    prisma.contenido.findUniqueOrThrow.mockResolvedValue(buildContenidoRow({ archivado: false }))

    const result = await service.restaurarContenido("curso-1", "mod-1", "sec-1", "cont-1")

    expect(prisma.contenido.update).not.toHaveBeenCalled()
    expect(result.archivado).toBe(false)
  })
})
