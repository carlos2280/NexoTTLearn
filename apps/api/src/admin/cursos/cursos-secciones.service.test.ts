import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import type {
  ActualizarSeccionAdminInput,
  CrearSeccionAdminInput,
  ReordenarSeccionesAdminInput,
} from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosSeccionesService } from "./cursos-secciones.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  modulo: { findUnique: Stub }
  seccion: {
    findUnique: Stub
    findMany: Stub
    create: Stub
    update: Stub
    delete: Stub
    count: Stub
  }
  entregaBloque: { count: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: { findUnique: vi.fn() },
    modulo: { findUnique: vi.fn() },
    seccion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    entregaBloque: { count: vi.fn() },
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
  const service = new CursosSeccionesService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const MODULO_ID = "00000000-0000-0000-0000-000000000003"
const SECCION_ID = "00000000-0000-0000-0000-000000000004"

function buildSeccionRow(
  overrides: Partial<{
    id: string
    moduloId: string
    titulo: string
    orden: number
    archivadoAt: Date | null
    archivadoEstado: "ARCHIVADO" | null
  }> = {},
) {
  const now = new Date("2026-05-06T10:00:00Z")
  return {
    id: overrides.id ?? SECCION_ID,
    moduloId: overrides.moduloId ?? MODULO_ID,
    titulo: overrides.titulo ?? "Sección de prueba",
    orden: overrides.orden ?? 0,
    archivadoAt: overrides.archivadoAt ?? null,
    archivadoEstado: overrides.archivadoEstado ?? null,
    createdAt: now,
    updatedAt: now,
    _count: { bloques: 0 },
    bloques: [],
  }
}

function buildCurso(estado: "BORRADOR" | "ACTIVO" | "CERRADO" = "BORRADOR") {
  return { id: CURSO_ID, estado }
}

function buildModulo(archivadoAt: Date | null = null) {
  return { id: MODULO_ID, cursoId: CURSO_ID, archivadoAt }
}

// ─────────────────────────────────────────────────────────────────
// LISTAR
// ─────────────────────────────────────────────────────────────────

describe("listar", () => {
  it("devuelve lista vacia cuando no hay secciones", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findMany.mockResolvedValue([])

    const result = await service.listar(CURSO_ID, MODULO_ID)
    expect(result).toEqual([])
  })

  it("lanza 404 si el modulo no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(null)

    await expect(service.listar(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si el modulo esta archivado", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo(new Date()))

    await expect(service.listar(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si el modulo no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue({
      id: MODULO_ID,
      cursoId: "otro-curso",
      archivadoAt: null,
    })

    await expect(service.listar(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })

  it("cuenta entregas correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findMany.mockResolvedValue([buildSeccionRow()])
    prisma.entregaBloque.count.mockResolvedValue(2)

    const result = await service.listar(CURSO_ID, MODULO_ID)
    expect(result).toHaveLength(1)
    expect(result[0]?.tieneEntregas).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────
// OBTENER POR ID
// ─────────────────────────────────────────────────────────────────

describe("obtenerPorId", () => {
  it("devuelve la seccion si existe y pertenece al modulo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.obtenerPorId(CURSO_ID, MODULO_ID, SECCION_ID)
    expect(result.id).toBe(SECCION_ID)
  })

  it("lanza 404 si la seccion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.seccion.findUnique.mockResolvedValue(null)

    await expect(service.obtenerPorId(CURSO_ID, MODULO_ID, SECCION_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("lanza 404 si la seccion pertenece a otro modulo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow({ moduloId: "otro-modulo" }))

    await expect(service.obtenerPorId(CURSO_ID, MODULO_ID, SECCION_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// CREAR
// ─────────────────────────────────────────────────────────────────

describe("crear", () => {
  const input: CrearSeccionAdminInput = { titulo: "Nueva sección" }

  it("crea la seccion correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.count.mockResolvedValue(0)
    const seccionCreada = buildSeccionRow()
    prisma.seccion.create.mockResolvedValue(seccionCreada)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.seccion.findUnique.mockResolvedValue(seccionCreada)
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.crear(CURSO_ID, MODULO_ID, input, ACTOR_ID)
    expect(result.id).toBe(SECCION_ID)
    expect(prisma.seccion.create).toHaveBeenCalledOnce()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(service.crear(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el modulo esta archivado", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo(new Date()))

    await expect(service.crear(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })

  it("usa orden default = count de secciones activas", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.count.mockResolvedValue(3)
    const seccionCreada = buildSeccionRow({ orden: 3 })
    prisma.seccion.create.mockResolvedValue(seccionCreada)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.seccion.findUnique.mockResolvedValue(seccionCreada)
    prisma.entregaBloque.count.mockResolvedValue(0)

    await service.crear(CURSO_ID, MODULO_ID, input, ACTOR_ID)
    expect(prisma.seccion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orden: 3 }) }),
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza titulo correctamente", async () => {
    const { service, prisma } = buildService()
    const previo = buildSeccionRow()
    prisma.seccion.findUnique.mockResolvedValueOnce(previo)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    const actualizada = buildSeccionRow({ titulo: "Titulo actualizado" })
    prisma.seccion.update.mockResolvedValue(actualizada)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.seccion.findUnique.mockResolvedValueOnce(actualizada)
    prisma.entregaBloque.count.mockResolvedValue(0)

    const input: ActualizarSeccionAdminInput = { titulo: "Titulo actualizado" }
    const result = await service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, input, ACTOR_ID)
    expect(result.titulo).toBe("Titulo actualizado")
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, { titulo: "X" }, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si la seccion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(null)

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, SECCION_ID, { titulo: "X" }, ACTOR_ID),
    ).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ARCHIVAR / DESARCHIVAR
// ─────────────────────────────────────────────────────────────────

describe("archivar", () => {
  it("archiva la seccion", async () => {
    const { service, prisma } = buildService()
    const previo = buildSeccionRow()
    prisma.seccion.findUnique.mockResolvedValueOnce(previo)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    const archivada = buildSeccionRow({ archivadoAt: new Date() })
    prisma.seccion.update.mockResolvedValue(archivada)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.seccion.findUnique.mockResolvedValueOnce(archivada)
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)
    expect(result.archivadoAt).not.toBeNull()
  })

  it("es idempotente: ya archivada devuelve sin error ni re-actualizar", async () => {
    const { service, prisma } = buildService()
    const archivada = buildSeccionRow({ archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" })
    prisma.seccion.findUnique.mockResolvedValue(archivada)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)
    expect(result.archivadoAt).not.toBeNull()
    expect(prisma.seccion.update).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(service.archivar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })
})

describe("desarchivar", () => {
  it("desarchiva la seccion", async () => {
    const { service, prisma } = buildService()
    const archivada = buildSeccionRow({ archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" })
    prisma.seccion.findUnique.mockResolvedValueOnce(archivada)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    const activa = buildSeccionRow()
    prisma.seccion.update.mockResolvedValue(activa)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.seccion.findUnique.mockResolvedValueOnce(activa)
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)
    expect(result.archivadoAt).toBeNull()
  })

  it("es idempotente: seccion activa devuelve sin error", async () => {
    const { service, prisma } = buildService()
    const activa = buildSeccionRow()
    prisma.seccion.findUnique.mockResolvedValue(activa)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)
    expect(result.archivadoAt).toBeNull()
    expect(prisma.seccion.update).not.toHaveBeenCalled()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    const archivada = buildSeccionRow({ archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" })
    prisma.seccion.findUnique.mockResolvedValue(archivada)
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(service.desarchivar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina la seccion en curso BORRADOR sin entregas", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.seccion.delete.mockResolvedValue({})

    const result = await service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)
    expect(result.tipo).toBe("ELIMINADO")
    expect(result.id).toBe(SECCION_ID)
  })

  it("lanza 409 si el curso no es BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("ACTIVO"))

    await expect(service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 409 si tiene entregas", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(buildSeccionRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(1)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si la seccion no existe", async () => {
    const { service, prisma } = buildService()
    prisma.seccion.findUnique.mockResolvedValue(null)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, SECCION_ID, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})

// ─────────────────────────────────────────────────────────────────
// REORDENAR
// ─────────────────────────────────────────────────────────────────

describe("reordenar", () => {
  const seccionId2 = "00000000-0000-0000-0000-000000000005"

  it("reordena secciones correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findMany
      .mockResolvedValueOnce([{ id: SECCION_ID }, { id: seccionId2 }])
      .mockResolvedValueOnce([
        buildSeccionRow({ id: SECCION_ID, orden: 1 }),
        buildSeccionRow({ id: seccionId2, orden: 0 }),
      ])
    prisma.seccion.update.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})
    prisma.entregaBloque.count.mockResolvedValue(0)

    const input: ReordenarSeccionesAdminInput = {
      items: [
        { id: SECCION_ID, orden: 1 },
        { id: seccionId2, orden: 0 },
      ],
    }
    const result = await service.reordenar(CURSO_ID, MODULO_ID, input, ACTOR_ID)
    expect(result).toHaveLength(2)
    expect(prisma.seccion.update).toHaveBeenCalledTimes(2)
  })

  it("lanza 400 si subset incompleto", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findMany.mockResolvedValue([{ id: SECCION_ID }, { id: seccionId2 }])

    const input: ReordenarSeccionesAdminInput = {
      items: [{ id: SECCION_ID, orden: 0 }],
    }
    await expect(service.reordenar(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      BadRequestException,
    )
  })

  it("lanza 400 si id ajeno", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findMany.mockResolvedValue([{ id: SECCION_ID }])

    const input: ReordenarSeccionesAdminInput = {
      items: [{ id: "id-inexistente", orden: 0 }],
    }
    await expect(service.reordenar(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      BadRequestException,
    )
  })

  it("lanza 400 si orden duplicado", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo())
    prisma.seccion.findMany.mockResolvedValue([{ id: SECCION_ID }, { id: seccionId2 }])

    const input: ReordenarSeccionesAdminInput = {
      items: [
        { id: SECCION_ID, orden: 0 },
        { id: seccionId2, orden: 0 },
      ],
    }
    await expect(service.reordenar(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      BadRequestException,
    )
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    const input: ReordenarSeccionesAdminInput = { items: [{ id: SECCION_ID, orden: 0 }] }
    await expect(service.reordenar(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })

  it("lanza 404 si el modulo esta archivado", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findUnique.mockResolvedValue(buildModulo(new Date()))

    const input: ReordenarSeccionesAdminInput = { items: [{ id: SECCION_ID, orden: 0 }] }
    await expect(service.reordenar(CURSO_ID, MODULO_ID, input, ACTOR_ID)).rejects.toThrow(
      NotFoundException,
    )
  })
})
