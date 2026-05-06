import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import type {
  ActualizarModuloAdminInput,
  CrearModuloAdminInput,
  ReordenarModulosAdminInput,
} from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosModulosService } from "./cursos-modulos.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  modulo: {
    findUnique: Stub
    findMany: Stub
    create: Stub
    update: Stub
    delete: Stub
    count: Stub
  }
  cursoArea: { findFirst: Stub }
  miniProyecto: { create: Stub; delete: Stub }
  entregaBloque: { count: Stub }
  entregaProyecto: { count: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: { findUnique: vi.fn() },
    modulo: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    cursoArea: { findFirst: vi.fn() },
    miniProyecto: { create: vi.fn(), delete: vi.fn() },
    entregaBloque: { count: vi.fn() },
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
  const service = new CursosModulosService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const MODULO_ID = "00000000-0000-0000-0000-000000000003"
const AREA_ID = "00000000-0000-0000-0000-000000000010"

function buildModuloRow(
  overrides: Partial<{
    id: string
    cursoId: string
    areaId: string
    titulo: string
    orden: number
    miniProyectoActivo: boolean
    umbralMiniOverride: number | null
    archivadoAt: Date | null
    archivadoEstado: "ARCHIVADO" | null
    clonadoDeId: string | null
    descripcion: string | null
  }> = {},
) {
  const now = new Date("2026-05-06T10:00:00Z")
  return {
    id: overrides.id ?? MODULO_ID,
    cursoId: overrides.cursoId ?? CURSO_ID,
    areaId: overrides.areaId ?? AREA_ID,
    titulo: overrides.titulo ?? "Módulo de prueba",
    descripcion: overrides.descripcion ?? null,
    orden: overrides.orden ?? 0,
    miniProyectoActivo: overrides.miniProyectoActivo ?? false,
    umbralMiniOverride: overrides.umbralMiniOverride ?? null,
    archivadoAt: overrides.archivadoAt ?? null,
    archivadoEstado: overrides.archivadoEstado ?? null,
    clonadoDeId: overrides.clonadoDeId ?? null,
    createdAt: now,
    updatedAt: now,
    _count: { secciones: 0 },
    secciones: [],
    miniProyecto: null,
  }
}

function buildCurso(estado: "BORRADOR" | "ACTIVO" | "CERRADO" = "BORRADOR") {
  return { id: CURSO_ID, estado }
}

// ─────────────────────────────────────────────────────────────────
// LISTAR
// ─────────────────────────────────────────────────────────────────

describe("listar", () => {
  it("devuelve lista vacia cuando no hay modulos", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findMany.mockResolvedValue([])

    const result = await service.listar(CURSO_ID)
    expect(result).toEqual([])
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.listar(CURSO_ID)).rejects.toThrow(NotFoundException)
  })

  it("cuenta entregas para cada modulo", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findMany.mockResolvedValue([buildModuloRow()])
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.listar(CURSO_ID)
    expect(result).toHaveLength(1)
    expect(result[0]?.tieneEntregas).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────
// OBTENER POR ID
// ─────────────────────────────────────────────────────────────────

describe("obtenerPorId", () => {
  it("devuelve el modulo si existe y pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.obtenerPorId(CURSO_ID, MODULO_ID)
    expect(result.id).toBe(MODULO_ID)
  })

  it("lanza 404 si el modulo no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(null)

    await expect(service.obtenerPorId(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 404 si el modulo pertenece a otro curso", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow({ cursoId: "otro-curso-id" }))

    await expect(service.obtenerPorId(CURSO_ID, MODULO_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// CREAR
// ─────────────────────────────────────────────────────────────────

describe("crear", () => {
  const input: CrearModuloAdminInput = {
    titulo: "Nuevo módulo",
    areaId: AREA_ID,
  }

  it("crea el modulo correctamente", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValueOnce(buildCurso())
    prisma.cursoArea.findFirst.mockResolvedValue({ id: "ca-1" })
    prisma.modulo.count.mockResolvedValue(0)
    const moduloCreado = buildModuloRow()
    prisma.modulo.create.mockResolvedValue(moduloCreado)
    prisma.logActividad.create.mockResolvedValue({})
    // obtenerPorId al final
    prisma.modulo.findUnique.mockResolvedValue(moduloCreado)
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.crear(CURSO_ID, input, ACTOR_ID)
    expect(result.id).toBe(MODULO_ID)
    expect(prisma.modulo.create).toHaveBeenCalledOnce()
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(service.crear(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 400 si el areaId no esta en el curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.cursoArea.findFirst.mockResolvedValue(null)

    await expect(service.crear(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(BadRequestException)
  })

  it("crea MiniProyecto cuando miniProyectoActivo=true", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.cursoArea.findFirst.mockResolvedValue({ id: "ca-1" })
    prisma.modulo.count.mockResolvedValue(0)
    const moduloCreado = buildModuloRow({ miniProyectoActivo: true })
    prisma.modulo.create.mockResolvedValue(moduloCreado)
    prisma.miniProyecto.create.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.findUnique.mockResolvedValue(moduloCreado)
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    await service.crear(CURSO_ID, { ...input, miniProyectoActivo: true }, ACTOR_ID)
    expect(prisma.miniProyecto.create).toHaveBeenCalledOnce()
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.crear(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ACTUALIZAR
// ─────────────────────────────────────────────────────────────────

describe("actualizar", () => {
  it("actualiza titulo correctamente", async () => {
    const { service, prisma } = buildService()
    const previo = buildModuloRow()
    // requireModulo
    prisma.modulo.findUnique.mockResolvedValueOnce(previo)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    const actualizado = buildModuloRow({ titulo: "Titulo actualizado" })
    prisma.modulo.update.mockResolvedValue(actualizado)
    prisma.logActividad.create.mockResolvedValue({})
    // obtenerPorId al final
    prisma.modulo.findUnique.mockResolvedValueOnce(actualizado)
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const input: ActualizarModuloAdminInput = { titulo: "Titulo actualizado" }
    const result = await service.actualizar(CURSO_ID, MODULO_ID, input, ACTOR_ID)
    expect(result.titulo).toBe("Titulo actualizado")
  })

  it("lanza 409 si curso CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, { titulo: "X" }, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })

  it("lanza 400 si el nuevo areaId no esta en el curso", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.cursoArea.findFirst.mockResolvedValue(null)

    const otroArea = "00000000-0000-0000-0000-000000000099"
    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, { areaId: otroArea }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })

  it("lanza 409 al desactivar mini con entregas", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow({ miniProyectoActivo: true }))
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.entregaProyecto.count.mockResolvedValue(2)

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, { miniProyectoActivo: false }, ACTOR_ID),
    ).rejects.toThrow(ConflictException)
  })
})

// ─────────────────────────────────────────────────────────────────
// ARCHIVAR / DESARCHIVAR
// ─────────────────────────────────────────────────────────────────

describe("archivar", () => {
  it("archiva el modulo", async () => {
    const { service, prisma } = buildService()
    const previo = buildModuloRow()
    prisma.modulo.findUnique.mockResolvedValueOnce(previo)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    const archivado = buildModuloRow({ archivadoAt: new Date() })
    prisma.modulo.update.mockResolvedValue(archivado)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.findUnique.mockResolvedValueOnce(archivado)
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.archivar(CURSO_ID, MODULO_ID, ACTOR_ID)
    expect(result.archivadoAt).not.toBeNull()
  })

  it("es idempotente: ya archivado devuelve sin error ni re-actualizar", async () => {
    const { service, prisma } = buildService()
    const archivado = buildModuloRow({ archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" })
    prisma.modulo.findUnique.mockResolvedValueOnce(archivado)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.archivar(CURSO_ID, MODULO_ID, ACTOR_ID)
    expect(result.archivadoAt).not.toBeNull()
    expect(prisma.modulo.update).not.toHaveBeenCalled()
  })
})

describe("desarchivar", () => {
  it("desarchiva el modulo", async () => {
    const { service, prisma } = buildService()
    const archivado = buildModuloRow({ archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" })
    prisma.modulo.findUnique.mockResolvedValueOnce(archivado)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    const desarchivado = buildModuloRow()
    prisma.modulo.update.mockResolvedValue(desarchivado)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.findUnique.mockResolvedValueOnce(desarchivado)
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.desarchivar(CURSO_ID, MODULO_ID, ACTOR_ID)
    expect(result.archivadoAt).toBeNull()
  })

  it("es idempotente: modulo no archivado devuelve sin error", async () => {
    const { service, prisma } = buildService()
    const activo = buildModuloRow()
    prisma.modulo.findUnique.mockResolvedValue(activo)
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.desarchivar(CURSO_ID, MODULO_ID, ACTOR_ID)
    expect(result.archivadoAt).toBeNull()
    expect(prisma.modulo.update).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────────────────────────────

describe("eliminar", () => {
  it("elimina el modulo en curso BORRADOR sin entregas", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.delete.mockResolvedValue({})

    const result = await service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)
    expect(result.tipo).toBe("ELIMINADO")
    expect(result.id).toBe(MODULO_ID)
  })

  it("lanza 409 si el curso no es BORRADOR", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("ACTIVO"))

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si tiene entregas de bloque", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(3)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si tiene entregas de proyecto", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("BORRADOR"))
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(1)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 404 si el modulo no existe", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(null)

    await expect(service.eliminar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// REORDENAR
// ─────────────────────────────────────────────────────────────────

describe("reordenar", () => {
  it("reordena modulos correctamente", async () => {
    const { service, prisma } = buildService()
    const moduloId2 = "00000000-0000-0000-0000-000000000004"
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findMany
      .mockResolvedValueOnce([{ id: MODULO_ID }, { id: moduloId2 }])
      .mockResolvedValueOnce([
        buildModuloRow({ id: MODULO_ID, orden: 1 }),
        buildModuloRow({ id: moduloId2, orden: 0 }),
      ])
    prisma.modulo.update.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValue({})
    prisma.entregaBloque.count.mockResolvedValue(0)
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const input: ReordenarModulosAdminInput = {
      items: [
        { id: MODULO_ID, orden: 1 },
        { id: moduloId2, orden: 0 },
      ],
    }
    const result = await service.reordenar(CURSO_ID, input, ACTOR_ID)
    expect(result).toHaveLength(2)
    expect(prisma.modulo.update).toHaveBeenCalledTimes(2)
  })

  it("lanza 400 si algun id no pertenece al curso", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findMany.mockResolvedValue([{ id: MODULO_ID }])

    const input: ReordenarModulosAdminInput = {
      items: [{ id: "id-inexistente", orden: 0 }],
    }
    await expect(service.reordenar(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(BadRequestException)
  })

  it("lanza 404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)

    const input: ReordenarModulosAdminInput = { items: [{ id: MODULO_ID, orden: 0 }] }
    await expect(service.reordenar(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    const input: ReordenarModulosAdminInput = { items: [{ id: MODULO_ID, orden: 0 }] }
    await expect(service.reordenar(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 400 si la lista no incluye todos los modulos no archivados (subset incompleto)", async () => {
    const { service, prisma } = buildService()
    const moduloId2 = "00000000-0000-0000-0000-000000000004"
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    // Hay 2 modulos activos en el curso pero el caller solo manda 1
    prisma.modulo.findMany.mockResolvedValue([{ id: MODULO_ID }, { id: moduloId2 }])

    const input: ReordenarModulosAdminInput = {
      items: [{ id: MODULO_ID, orden: 0 }],
    }
    await expect(service.reordenar(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(BadRequestException)
  })

  it("lanza 400 si los valores de orden tienen duplicados (permutacion invalida)", async () => {
    const { service, prisma } = buildService()
    const moduloId2 = "00000000-0000-0000-0000-000000000004"
    prisma.curso.findUnique.mockResolvedValue(buildCurso())
    prisma.modulo.findMany.mockResolvedValue([{ id: MODULO_ID }, { id: moduloId2 }])

    // length OK e ids OK, pero orden duplicado (ambos = 0)
    const input: ReordenarModulosAdminInput = {
      items: [
        { id: MODULO_ID, orden: 0 },
        { id: moduloId2, orden: 0 },
      ],
    }
    await expect(service.reordenar(CURSO_ID, input, ACTOR_ID)).rejects.toThrow(BadRequestException)
  })
})

// ─────────────────────────────────────────────────────────────────
// REGRESIONES Iter 3 (auditoría)
// ─────────────────────────────────────────────────────────────────

describe("archivar / desarchivar en curso CERRADO", () => {
  it("archivar lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow())
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(service.archivar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("desarchivar lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.modulo.findUnique.mockResolvedValue(
      buildModuloRow({ archivadoAt: new Date(), archivadoEstado: "ARCHIVADO" }),
    )
    prisma.curso.findUnique.mockResolvedValue(buildCurso("CERRADO"))

    await expect(service.desarchivar(CURSO_ID, MODULO_ID, ACTOR_ID)).rejects.toThrow(
      ConflictException,
    )
  })
})

describe("actualizar coherencia umbralMiniOverride / miniProyectoActivo", () => {
  it("lanza 400 si umbralMiniOverride es number y mini quedaria inactivo (previo y patch ambos false)", async () => {
    const { service, prisma } = buildService()
    // Modulo previo con mini inactivo y se intenta setear umbral sin activar mini
    prisma.modulo.findUnique.mockResolvedValue(buildModuloRow({ miniProyectoActivo: false }))
    prisma.curso.findUnique.mockResolvedValue(buildCurso())

    await expect(
      service.actualizar(CURSO_ID, MODULO_ID, { umbralMiniOverride: 80 }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException)
  })
})
