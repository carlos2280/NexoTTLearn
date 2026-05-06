import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
import type {
  ActualizarCursoAreaInput,
  ActualizarCursoAreasInput,
  ActualizarCursoInput,
  AgregarCursoAreaInput,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosService } from "./cursos.service"

// PrismaMock: solo lo que el service toca. Patron del test de areas adaptado
// al schema v2 de cursos. Soporta `$transaction(callback)` y `$transaction([promesas])`.

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: {
    findUnique: Stub
    findMany: Stub
    count: Stub
    create: Stub
    update: Stub
    delete: Stub
  }
  cursoArea: {
    create: Stub
    update: Stub
    delete: Stub
    deleteMany: Stub
    findUnique: Stub
  }
  modulo: {
    create: Stub
    findMany: Stub
    groupBy: Stub
    count: Stub
    updateMany: Stub
  }
  seccion: { create: Stub }
  bloque: { create: Stub }
  miniProyecto: { create: Stub }
  area: { findMany: Stub; findUnique: Stub }
  inscripcion: { count: Stub }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    curso: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cursoArea: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    modulo: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    seccion: { create: vi.fn() },
    bloque: { create: vi.fn() },
    miniProyecto: { create: vi.fn() },
    area: { findMany: vi.fn(), findUnique: vi.fn() },
    inscripcion: { count: vi.fn() },
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
  const service = new CursosService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const CURSO_ID = "00000000-0000-0000-0000-000000000002"
const AREA_ID_FE = "00000000-0000-0000-0000-000000000010"
const AREA_ID_BE = "00000000-0000-0000-0000-000000000011"

function decimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n)
}

interface CursoOverrides {
  id?: string
  empresaCliente?: string
  titulo?: string
  slug?: string
  estado?: "BORRADOR" | "ACTIVO" | "CERRADO"
  fechaInicio?: Date | null
  deadline?: Date | null
  pesoAreas?: number
  pesoProyectoTransversal?: number
  pesoEntrevistaIA?: number
  pesoActividades?: number
  pesoMiniProyecto?: number
  umbralExcelencia?: number
  umbralAprobado?: number
  umbralEnDesarrollo?: number
  cursoAreas?: Array<{
    id: string
    areaId: string
    peso: number
    puntajeObjetivo: number
    orden: number
  }>
  proyectoTransversal?: { id: string } | null
  entrevistaIAConfig?: { id: string } | null
  duplicadoDeId?: string | null
  inscripcionesActivas?: number
}

function buildCursoDetalleRow(overrides: CursoOverrides = {}) {
  const now = new Date("2026-05-05T10:00:00Z")
  const id = overrides.id ?? CURSO_ID
  const cursoAreasInput = overrides.cursoAreas ?? [
    { id: "ca-1", areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
    { id: "ca-2", areaId: AREA_ID_BE, peso: 50, puntajeObjetivo: 70, orden: 1 },
  ]
  return {
    id,
    empresaCliente: overrides.empresaCliente ?? "Empresa XYZ",
    titulo: overrides.titulo ?? "Fullstack Developer",
    slug: overrides.slug ?? "fullstack-developer-empresa-xyz-2026q2",
    descripcion: null,
    imagenUrl: null,
    duracionEstimada: null,
    fechaInicio: overrides.fechaInicio !== undefined ? overrides.fechaInicio : null,
    deadline: overrides.deadline !== undefined ? overrides.deadline : null,
    estado: overrides.estado ?? "BORRADOR",
    permiteInscripcionLibre: false,
    pesoAreas: decimal(overrides.pesoAreas ?? 70),
    pesoProyectoTransversal: decimal(overrides.pesoProyectoTransversal ?? 20),
    pesoEntrevistaIA: decimal(overrides.pesoEntrevistaIA ?? 10),
    pesoActividades: decimal(overrides.pesoActividades ?? 70),
    pesoMiniProyecto: decimal(overrides.pesoMiniProyecto ?? 30),
    umbralExcelencia: overrides.umbralExcelencia ?? 90,
    umbralAprobado: overrides.umbralAprobado ?? 70,
    umbralEnDesarrollo: overrides.umbralEnDesarrollo ?? 50,
    umbralBrechaNoCumple: 10,
    publicadoAt: null,
    cerradoAt: null,
    duplicadoDeId: overrides.duplicadoDeId ?? null,
    createdAt: now,
    updatedAt: now,
    _count: {
      cursoAreas: cursoAreasInput.length,
      modulos: 0,
      inscripciones: overrides.inscripcionesActivas ?? 0,
    },
    cursoAreas: cursoAreasInput.map((ca) => ({
      id: ca.id,
      areaId: ca.areaId,
      peso: decimal(ca.peso),
      puntajeObjetivo: ca.puntajeObjetivo,
      orden: ca.orden,
      area: {
        id: ca.areaId,
        nombre: ca.areaId === AREA_ID_FE ? "Frontend" : "Backend",
        color: "#000000",
      },
    })),
    proyectoTransversal:
      overrides.proyectoTransversal !== undefined ? overrides.proyectoTransversal : null,
    entrevistaIAConfig:
      overrides.entrevistaIAConfig !== undefined ? overrides.entrevistaIAConfig : null,
  }
}

function buildCursoCompleto(overrides: CursoOverrides = {}) {
  // Curso "publicable" usado por publicar(): incluye modulos hidratados.
  const base = buildCursoDetalleRow({
    fechaInicio: new Date("2026-06-01T00:00:00Z"),
    deadline: new Date("2026-08-15T00:00:00Z"),
    proyectoTransversal: { id: "tr-1" },
    entrevistaIAConfig: { id: "ev-1" },
    ...overrides,
  })
  return {
    ...base,
    modulos: [
      {
        id: "mod-1",
        areaId: AREA_ID_FE,
        miniProyectoActivo: true,
        secciones: [{ id: "sec-1", bloques: [{ id: "blq-1" }] }],
      },
      {
        id: "mod-2",
        areaId: AREA_ID_BE,
        miniProyectoActivo: false,
        secciones: [{ id: "sec-2", bloques: [{ id: "blq-2" }] }],
      },
    ],
  }
}

// ─────────────────────────────────────────────────────────────────
// listar
// ─────────────────────────────────────────────────────────────────

describe("CursosService.listar", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("default sin estado, ordena por updatedAt desc", async () => {
    prisma.curso.findMany.mockResolvedValueOnce([buildCursoDetalleRow()])
    prisma.curso.count.mockResolvedValueOnce(1)

    const r = await service.listar({ page: 1, pageSize: 20 })

    expect(r.total).toBe(1)
    expect(r.items).toHaveLength(1)
    expect(prisma.curso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { updatedAt: "desc" },
        skip: 0,
        take: 20,
      }),
    )
  })

  it("estado=ACTIVO filtra y q busca empresa+titulo case-insensitive", async () => {
    prisma.curso.findMany.mockResolvedValueOnce([])
    prisma.curso.count.mockResolvedValueOnce(0)

    await service.listar({ estado: "ACTIVO", q: "xyz", page: 1, pageSize: 20 })

    const llamada = prisma.curso.findMany.mock.calls[0]?.[0]
    expect(llamada.where.estado).toBe("ACTIVO")
    expect(llamada.where.OR).toEqual([
      { titulo: { contains: "xyz", mode: "insensitive" } },
      { empresaCliente: { contains: "xyz", mode: "insensitive" } },
    ])
  })

  it("estado=all no aplica filtro de estado", async () => {
    prisma.curso.findMany.mockResolvedValueOnce([])
    prisma.curso.count.mockResolvedValueOnce(0)

    await service.listar({ estado: "all", page: 2, pageSize: 5 })

    const llamada = prisma.curso.findMany.mock.calls[0]?.[0]
    expect(llamada.where).toEqual({})
    expect(llamada.skip).toBe(5)
    expect(llamada.take).toBe(5)
  })
})

// ─────────────────────────────────────────────────────────────────
// crear
// ─────────────────────────────────────────────────────────────────

describe("CursosService.crear", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("crea BORRADOR con slug autogenerado, emite log CURSO_CREADO y devuelve detalle", async () => {
    // 1. resolverSlugUnico: findUnique para slug → null (no colision)
    prisma.curso.findUnique
      .mockResolvedValueOnce(null) // slug check
      // 2. obtenerPorId tras crear:
      .mockResolvedValueOnce(buildCursoDetalleRow())
    // El service ahora hace `select: CURSO_DETALLE_SELECT` en el create
    // porque necesita el snapshot completo para el log. El mock devuelve un
    // detalle valido (no solo `{id}`).
    prisma.curso.create.mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    const r = await service.crear(
      { empresaCliente: "Empresa XYZ", titulo: "Fullstack Developer" },
      ACTOR_ID,
    )

    expect(r.id).toBe(CURSO_ID)
    expect(prisma.curso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          empresaCliente: "Empresa XYZ",
          titulo: "Fullstack Developer",
          slug: expect.stringContaining("fullstack-developer-empresa-xyz"),
        }),
      }),
    )
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "CURSO_CREADO",
        entidadTipo: "Curso",
        entidadId: CURSO_ID,
        valorAntes: Prisma.JsonNull,
        valorDespues: expect.objectContaining({ titulo: "Fullstack Developer" }),
      }),
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// duplicar
// ─────────────────────────────────────────────────────────────────

describe("CursosService.crear (duplicar)", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  function buildOrigenConModulos() {
    const base = buildCursoDetalleRow()
    return {
      ...base,
      modulos: [
        {
          id: "mod-orig-1",
          areaId: AREA_ID_FE,
          titulo: "Modulo Frontend",
          descripcion: "desc",
          orden: 0,
          miniProyectoActivo: true,
          umbralMiniOverride: null,
          secciones: [
            {
              id: "sec-orig-1",
              titulo: "Intro",
              orden: 0,
              bloques: [
                {
                  id: "blq-orig-1",
                  tipo: "PARRAFO",
                  orden: 0,
                  codigoUbicacion: null,
                  codigoInteractivo: null,
                  codigoEvaluable: null,
                  codigoLenguaje: null,
                  payload: { contenidoTiptap: { type: "doc" } },
                  solucionReferencia: null,
                },
              ],
            },
          ],
          miniProyecto: {
            titulo: "Mini",
            enunciado: "haz X",
            pesoCapa1: decimal(40),
            pesoCapa2: decimal(30),
            pesoCapa3: decimal(30),
          },
        },
      ],
    }
  }

  it("duplica armazon, emite log CURSO_DUPLICADO y NO copia transversal/entrevista/inscripciones", async () => {
    const origen = buildOrigenConModulos()
    const nuevoId = "00000000-0000-0000-0000-000000000099"

    prisma.curso.findUnique
      // 1. carga origen completo
      .mockResolvedValueOnce(origen)
      // 2. resolver slug unico (no colisiona)
      .mockResolvedValueOnce(null)
      // 3. obtenerPorId del curso nuevo
      .mockResolvedValueOnce(buildCursoDetalleRow({ id: nuevoId, duplicadoDeId: CURSO_ID }))
    // El create del clon ahora pide CURSO_DETALLE_SELECT.
    prisma.curso.create.mockResolvedValueOnce(
      buildCursoDetalleRow({ id: nuevoId, duplicadoDeId: CURSO_ID }),
    )
    prisma.cursoArea.create.mockResolvedValue({})
    prisma.modulo.create.mockResolvedValueOnce({ id: "mod-nueva" })
    prisma.seccion.create.mockResolvedValueOnce({ id: "sec-nueva" })
    prisma.bloque.create.mockResolvedValue({})
    prisma.miniProyecto.create.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    const r = await service.crear(
      {
        empresaCliente: "Empresa Otra",
        titulo: "Fullstack Developer",
        duplicarDeId: CURSO_ID,
      },
      ACTOR_ID,
    )

    expect(r.id).toBe(nuevoId)
    // Empresa cambia a la del body, no a la del origen.
    const cursoCreate = prisma.curso.create.mock.calls[0]?.[0]
    expect(cursoCreate.data.empresaCliente).toBe("Empresa Otra")
    expect(cursoCreate.data.duplicadoDeId).toBe(CURSO_ID)
    // Titulo lleva sufijo "(copia)" cuando coincide con el del origen.
    expect(cursoCreate.data.titulo).toContain("(copia)")
    // Estado default BORRADOR (no se setea explicito en data → default schema).
    expect(cursoCreate.data.estado).toBeUndefined()
    // CursoArea, Modulo, Seccion, Bloque, MiniProyecto se crearon.
    expect(prisma.cursoArea.create).toHaveBeenCalled()
    expect(prisma.modulo.create).toHaveBeenCalled()
    expect(prisma.seccion.create).toHaveBeenCalled()
    expect(prisma.bloque.create).toHaveBeenCalled()
    expect(prisma.miniProyecto.create).toHaveBeenCalled()
    // Log de duplicacion con referencia al origen.
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "CURSO_DUPLICADO",
        entidadTipo: "Curso",
        entidadId: nuevoId,
        valorAntes: Prisma.JsonNull,
        valorDespues: expect.objectContaining({ duplicadoDeId: CURSO_ID }),
      }),
    })
  })

  it("origen inexistente → 404", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.crear({ empresaCliente: "X", titulo: "Y", duplicarDeId: CURSO_ID }, ACTOR_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// actualizar (PATCH)
// ─────────────────────────────────────────────────────────────────

describe("CursosService.actualizar", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("404 si no existe", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.actualizar(CURSO_ID, { titulo: "Nuevo" }, ACTOR_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("CERRADO → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "CERRADO" }))
    await expect(
      service.actualizar(CURSO_ID, { titulo: "Nuevo" }, ACTOR_ID),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("happy path BORRADOR: aplica patch y emite log CURSO_ACTUALIZADO", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow())
      .mockResolvedValueOnce(buildCursoDetalleRow({ titulo: "Nuevo" }))
    // El service ahora pide CURSO_DETALLE_SELECT en el update para snapshot.
    prisma.curso.update.mockResolvedValueOnce(buildCursoDetalleRow({ titulo: "Nuevo" }))
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    await service.actualizar(CURSO_ID, { titulo: "Nuevo" }, ACTOR_ID)

    const datos = prisma.curso.update.mock.calls[0]?.[0]
    expect(datos.data.titulo).toBe("Nuevo")
    // Solo CURSO_ACTUALIZADO (no hay cambio de pesos en ACTIVO).
    expect(prisma.logActividad.create).toHaveBeenCalledTimes(1)
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "CURSO_ACTUALIZADO",
        entidadTipo: "Curso",
        entidadId: CURSO_ID,
        valorAntes: expect.objectContaining({ titulo: "Fullstack Developer" }),
        valorDespues: expect.objectContaining({ titulo: "Nuevo" }),
      }),
    })
  })

  it("PATCH vacio: no llama update ni emite log (idempotente)", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow())
      .mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    await service.actualizar(CURSO_ID, {}, ACTOR_ID)

    expect(prisma.curso.update).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })

  it("ACTIVO + cambio de pesos → emite CURSO_ACTUALIZADO + CURSO_PESOS_RECALCULO_PENDIENTE", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO", pesoAreas: 65 }))
    prisma.curso.update.mockResolvedValueOnce(
      buildCursoDetalleRow({ estado: "ACTIVO", pesoAreas: 65 }),
    )
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    await service.actualizar(CURSO_ID, { pesoAreas: 65 }, ACTOR_ID)

    expect(prisma.logActividad.create).toHaveBeenCalledTimes(2)
    const llamadas = prisma.logActividad.create.mock.calls.map(
      (c) => (c[0] as { data: { tipoAccion: string } }).data.tipoAccion,
    )
    expect(llamadas).toEqual(["CURSO_ACTUALIZADO", "CURSO_PESOS_RECALCULO_PENDIENTE"])
  })

  it("umbrales que rompen orden estricto → 400", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow())
    // Solo umbralEnDesarrollo viene; comparado con persistidos (50/70/90),
    // valor 80 rompe el orden 80<70 falla.
    await expect(
      service.actualizar(CURSO_ID, { umbralEnDesarrollo: 80 } as ActualizarCursoInput, ACTOR_ID),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("slug duplicado → 409", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow({ slug: "viejo" }))
      // colision slug
      .mockResolvedValueOnce({ id: "otro-curso" })
    await expect(
      service.actualizar(
        CURSO_ID,
        { slug: "duplicado-existente" } as ActualizarCursoInput,
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})

// ─────────────────────────────────────────────────────────────────
// actualizarAreas (PUT)
// ─────────────────────────────────────────────────────────────────

describe("CursosService.actualizarAreas", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("ACTIVO → 409 ERROR_AREAS_SOLO_BORRADOR", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
    await expect(
      service.actualizarAreas(
        CURSO_ID,
        {
          areas: [{ areaId: AREA_ID_FE, peso: 100, puntajeObjetivo: 70, orden: 0 }],
        },
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("happy path BORRADOR: deleteMany + create por cada area + log CURSO_AREAS_ACTUALIZADAS", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow())
      // Releer dentro de la transaccion (snapshot despues)
      .mockResolvedValueOnce(buildCursoDetalleRow())
      // obtenerPorId final
      .mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.area.findMany.mockResolvedValueOnce([
      { id: AREA_ID_FE, estado: "ACTIVA" },
      { id: AREA_ID_BE, estado: "ACTIVA" },
    ])
    prisma.cursoArea.deleteMany.mockResolvedValueOnce({ count: 0 })
    prisma.cursoArea.create.mockResolvedValue({})
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    const input: ActualizarCursoAreasInput = {
      areas: [
        { areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
        { areaId: AREA_ID_BE, peso: 50, puntajeObjetivo: 70, orden: 1 },
      ],
    }
    await service.actualizarAreas(CURSO_ID, input, ACTOR_ID)

    expect(prisma.cursoArea.deleteMany).toHaveBeenCalledWith({ where: { cursoId: CURSO_ID } })
    expect(prisma.cursoArea.create).toHaveBeenCalledTimes(2)
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: ACTOR_ID,
        tipoAccion: "CURSO_AREAS_ACTUALIZADAS",
        entidadTipo: "Curso",
        entidadId: CURSO_ID,
      }),
    })
  })

  it("areaId inexistente → 400", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.area.findMany.mockResolvedValueOnce([{ id: AREA_ID_FE, estado: "ACTIVA" }]) // falta BE

    await expect(
      service.actualizarAreas(
        CURSO_ID,
        {
          areas: [
            { areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
            { areaId: AREA_ID_BE, peso: 50, puntajeObjetivo: 70, orden: 1 },
          ],
        },
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("area en estado OBSOLETA → 400 ERROR_AREA_OBSOLETA", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.area.findMany.mockResolvedValueOnce([
      { id: AREA_ID_FE, estado: "ACTIVA" },
      { id: AREA_ID_BE, estado: "OBSOLETA" },
    ])

    await expect(
      service.actualizarAreas(
        CURSO_ID,
        {
          areas: [
            { areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
            { areaId: AREA_ID_BE, peso: 50, puntajeObjetivo: 70, orden: 1 },
          ],
        },
        ACTOR_ID,
      ),
    ).rejects.toThrow(/OBSOLETA/)
    expect(prisma.cursoArea.deleteMany).not.toHaveBeenCalled()
    expect(prisma.cursoArea.create).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────
// publicar
// ─────────────────────────────────────────────────────────────────

describe("CursosService.publicar", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("Caso A: faltantes (cliente vacio) sin transicion", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoCompleto({ empresaCliente: "  " }))

    const r = await service.publicar(CURSO_ID, ACTOR_ID)

    expect(r.caso).toBe("A_FALTANTES")
    if (r.caso === "A_FALTANTES") {
      expect(r.faltantes.find((f) => f.id === "cliente_titulo")).toBeDefined()
    }
    expect(prisma.curso.update).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })

  it("Caso B: curso completo → ACTIVO + log CURSO_PUBLICADO + resumen", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoCompleto())
      // obtenerPorId al final
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
    prisma.curso.update.mockResolvedValueOnce({ id: CURSO_ID })
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([
      { areaId: AREA_ID_FE, _count: { _all: 1 } },
      { areaId: AREA_ID_BE, _count: { _all: 1 } },
    ])

    const r = await service.publicar(CURSO_ID, ACTOR_ID)

    expect(r.caso).toBe("B_OK")
    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CURSO_ID },
        data: expect.objectContaining({ estado: "ACTIVO", publicadoAt: expect.any(Date) }),
      }),
    )
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipoAccion: "CURSO_PUBLICADO" }),
    })
  })

  it("Caso B idempotente: ya ACTIVO → no re-emite log ni cambia publicadoAt", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoCompleto({ estado: "ACTIVO" }))
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    const r = await service.publicar(CURSO_ID, ACTOR_ID)

    expect(r.caso).toBe("B_OK")
    expect(prisma.curso.update).not.toHaveBeenCalled()
    expect(prisma.logActividad.create).not.toHaveBeenCalled()
  })

  it("CERRADO → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoCompleto({ estado: "CERRADO" }))
    await expect(service.publicar(CURSO_ID, ACTOR_ID)).rejects.toBeInstanceOf(ConflictException)
  })
})

// ─────────────────────────────────────────────────────────────────
// despublicar / cerrar
// ─────────────────────────────────────────────────────────────────

describe("CursosService.despublicar", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("BORRADOR → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "BORRADOR" }))
    await expect(service.despublicar(CURSO_ID, {}, ACTOR_ID)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it("ACTIVO → BORRADOR + log con motivo", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "BORRADOR" }))
    prisma.curso.update.mockResolvedValueOnce({ id: CURSO_ID })
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    await service.despublicar(CURSO_ID, { motivo: "Reorganizar pesos" }, ACTOR_ID)

    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipoAccion: "CURSO_DESPUBLICADO",
        motivo: "Reorganizar pesos",
      }),
    })
  })
})

describe("CursosService.cerrar", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("BORRADOR → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "BORRADOR" }))
    await expect(service.cerrar(CURSO_ID, {}, ACTOR_ID)).rejects.toBeInstanceOf(ConflictException)
  })

  it("ACTIVO → CERRADO + cerradoAt + log", async () => {
    prisma.curso.findUnique
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
      .mockResolvedValueOnce(buildCursoDetalleRow({ estado: "CERRADO" }))
    prisma.curso.update.mockResolvedValueOnce({ id: CURSO_ID })
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.modulo.groupBy.mockResolvedValueOnce([])

    await service.cerrar(CURSO_ID, {}, ACTOR_ID)

    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "CERRADO", cerradoAt: expect.any(Date) }),
      }),
    )
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipoAccion: "CURSO_CERRADO" }),
    })
  })

  it("CERRADO ya → no se puede republicar via cerrar", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "CERRADO" }))
    await expect(service.cerrar(CURSO_ID, {}, ACTOR_ID)).rejects.toBeInstanceOf(ConflictException)
  })
})

// ─────────────────────────────────────────────────────────────────
// eliminar
// ─────────────────────────────────────────────────────────────────

describe("CursosService.eliminar", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  it("ACTIVO → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))
    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toBeInstanceOf(ConflictException)
  })

  it("BORRADOR con inscripciones → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "BORRADOR" }))
    prisma.inscripcion.count.mockResolvedValueOnce(2)
    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.curso.delete).not.toHaveBeenCalled()
  })

  it("BORRADOR sin inscripciones → hard delete + log CURSO_ELIMINADO", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "BORRADOR" }))
    prisma.inscripcion.count.mockResolvedValueOnce(0)
    prisma.logActividad.create.mockResolvedValueOnce({})
    prisma.curso.delete.mockResolvedValueOnce({})

    const r = await service.eliminar(CURSO_ID, ACTOR_ID)

    expect(r).toEqual({ tipo: "ELIMINADA", id: CURSO_ID })
    expect(prisma.curso.delete).toHaveBeenCalledWith({ where: { id: CURSO_ID } })
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipoAccion: "CURSO_ELIMINADO",
        valorDespues: Prisma.JsonNull,
      }),
    })
  })

  it("404 si no existe", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(null)
    await expect(service.eliminar(CURSO_ID, ACTOR_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────────────
// agregarArea
// ─────────────────────────────────────────────────────────────────

const CURSO_AREA_ID = "00000000-0000-0000-0000-000000000020"
const AREA_ID_DB = "00000000-0000-0000-0000-000000000012"

function buildCursoAreaCreate() {
  return {
    id: CURSO_AREA_ID,
    areaId: AREA_ID_DB,
    peso: decimal(30),
    puntajeObjetivo: 70,
    orden: 2,
    area: { id: AREA_ID_DB, nombre: "Bases de datos", color: "#00ff00" },
  }
}

describe("CursosService.agregarArea", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  // Test 1
  it("happy path: crea cursoArea, emite CURSO_AREAS_ACTUALIZADAS, devuelve sumaPesosActual", async () => {
    const cursoConDosAreas = buildCursoDetalleRow()
    const cursoTrasAgregar = buildCursoDetalleRow({
      cursoAreas: [
        { id: "ca-1", areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
        { id: "ca-2", areaId: AREA_ID_BE, peso: 50, puntajeObjetivo: 70, orden: 1 },
        { id: CURSO_AREA_ID, areaId: AREA_ID_DB, peso: 30, puntajeObjetivo: 70, orden: 2 },
      ],
    })
    prisma.curso.findUnique
      .mockResolvedValueOnce(cursoConDosAreas) // carga inicial
      .mockResolvedValueOnce(cursoTrasAgregar) // releer dentro de tx
    prisma.area.findUnique.mockResolvedValueOnce({ id: AREA_ID_DB, estado: "ACTIVA" })
    prisma.cursoArea.create.mockResolvedValueOnce(buildCursoAreaCreate())
    prisma.logActividad.create.mockResolvedValueOnce({})

    const input: AgregarCursoAreaInput = { areaId: AREA_ID_DB, peso: 30, puntajeObjetivo: 70 }
    const r = await service.agregarArea(CURSO_ID, input, ACTOR_ID)

    expect(r.cursoArea.id).toBe(CURSO_AREA_ID)
    expect(r.sumaPesosActual).toBeCloseTo(130)
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipoAccion: "CURSO_AREAS_ACTUALIZADAS" }),
    })
  })

  // Test 2
  it("area en estado OBSOLETA → 400", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.area.findUnique.mockResolvedValueOnce({ id: AREA_ID_DB, estado: "OBSOLETA" })

    await expect(
      service.agregarArea(
        CURSO_ID,
        { areaId: AREA_ID_DB, peso: 30, puntajeObjetivo: 70 },
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  // Test 3
  it("area duplicada en curso → 400", async () => {
    // AREA_ID_FE ya esta en el curso por defecto
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow())
    prisma.area.findUnique.mockResolvedValueOnce({ id: AREA_ID_FE, estado: "ACTIVA" })

    await expect(
      service.agregarArea(
        CURSO_ID,
        { areaId: AREA_ID_FE, peso: 30, puntajeObjetivo: 70 },
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  // Test 4
  it("curso ACTIVO → 409", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(buildCursoDetalleRow({ estado: "ACTIVO" }))

    await expect(
      service.agregarArea(
        CURSO_ID,
        { areaId: AREA_ID_DB, peso: 30, puntajeObjetivo: 70 },
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})

// ─────────────────────────────────────────────────────────────────
// actualizarCursoArea
// ─────────────────────────────────────────────────────────────────

describe("CursosService.actualizarCursoArea", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  // Test 5
  it("input con clave desconocida rechazado por zod .strict() antes de llegar al service", () => {
    // El schema .strict() rechaza claves extra. Verificamos directamente el schema.
    const { actualizarCursoAreaInputSchema } = require("@nexott-learn/shared-types") as {
      actualizarCursoAreaInputSchema: { safeParse: (v: unknown) => { success: boolean } }
    }
    const r = actualizarCursoAreaInputSchema.safeParse({
      peso: 40,
      claveDesconocida: "valor",
    } as ActualizarCursoAreaInput & { claveDesconocida: string })
    expect(r.success).toBe(false)
  })

  // Test 6
  it("peso fuera de rango → 400", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(
      buildCursoDetalleRow({
        cursoAreas: [
          { id: CURSO_AREA_ID, areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
        ],
      }),
    )
    await expect(
      service.actualizarCursoArea(
        CURSO_ID,
        CURSO_AREA_ID,
        { peso: 150 } as ActualizarCursoAreaInput,
        ACTOR_ID,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})

// ─────────────────────────────────────────────────────────────────
// eliminarCursoArea
// ─────────────────────────────────────────────────────────────────

describe("CursosService.eliminarCursoArea", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  // Test 7
  it("area con modulos no archivados → 409 con modulosCount", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(
      buildCursoDetalleRow({
        cursoAreas: [
          { id: CURSO_AREA_ID, areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
        ],
      }),
    )
    prisma.modulo.count.mockResolvedValueOnce(3)

    await expect(
      service.eliminarCursoArea(CURSO_ID, CURSO_AREA_ID, ACTOR_ID),
    ).rejects.toMatchObject({
      message: expect.stringContaining("modulosCount: 3"),
    })
  })

  // Test 8
  it("sin modulos → elimina + emite log CURSO_AREAS_ACTUALIZADAS", async () => {
    const cursoTrasEliminar = buildCursoDetalleRow({ cursoAreas: [] })
    prisma.curso.findUnique
      .mockResolvedValueOnce(
        buildCursoDetalleRow({
          cursoAreas: [
            { id: CURSO_AREA_ID, areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
          ],
        }),
      )
      .mockResolvedValueOnce(cursoTrasEliminar)
    prisma.modulo.count.mockResolvedValueOnce(0)
    prisma.cursoArea.delete.mockResolvedValueOnce({})
    prisma.logActividad.create.mockResolvedValueOnce({})

    const r = await service.eliminarCursoArea(CURSO_ID, CURSO_AREA_ID, ACTOR_ID)

    expect(r).toEqual({ ok: true })
    expect(prisma.logActividad.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipoAccion: "CURSO_AREAS_ACTUALIZADAS" }),
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// reemplazarCursoArea
// ─────────────────────────────────────────────────────────────────

describe("CursosService.reemplazarCursoArea", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  // Test 9
  it("reasigna modulos en cascada con updateMany correcto", async () => {
    const cursoTrasReemplazar = buildCursoDetalleRow()
    prisma.curso.findUnique
      .mockResolvedValueOnce(
        buildCursoDetalleRow({
          cursoAreas: [
            { id: CURSO_AREA_ID, areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
          ],
        }),
      )
      .mockResolvedValueOnce(cursoTrasReemplazar)
    prisma.area.findUnique.mockResolvedValueOnce({ id: AREA_ID_DB, estado: "ACTIVA" })
    prisma.modulo.updateMany.mockResolvedValueOnce({ count: 2 })
    prisma.cursoArea.update.mockResolvedValueOnce({
      id: CURSO_AREA_ID,
      areaId: AREA_ID_DB,
      peso: decimal(50),
      puntajeObjetivo: 70,
      orden: 0,
      area: { id: AREA_ID_DB, nombre: "Bases de datos", color: "#00ff00" },
    })
    prisma.modulo.findMany.mockResolvedValueOnce([{ id: "mod-1" }, { id: "mod-2" }])
    prisma.logActividad.create.mockResolvedValue({})
    prisma.modulo.count.mockResolvedValueOnce(2)

    await service.reemplazarCursoArea(
      CURSO_ID,
      CURSO_AREA_ID,
      { nuevoAreaId: AREA_ID_DB },
      ACTOR_ID,
    )

    expect(prisma.modulo.updateMany).toHaveBeenCalledWith({
      where: { cursoId: CURSO_ID, areaId: AREA_ID_FE },
      data: { areaId: AREA_ID_DB },
    })
  })

  // Test 10
  it("nuevo area ya presente en curso → 400", async () => {
    // AREA_ID_BE ya esta en el curso por defecto
    prisma.curso.findUnique.mockResolvedValueOnce(
      buildCursoDetalleRow({
        cursoAreas: [
          { id: CURSO_AREA_ID, areaId: AREA_ID_FE, peso: 50, puntajeObjetivo: 70, orden: 0 },
          { id: "ca-otro", areaId: AREA_ID_BE, peso: 50, puntajeObjetivo: 70, orden: 1 },
        ],
      }),
    )
    prisma.area.findUnique.mockResolvedValueOnce({ id: AREA_ID_BE, estado: "ACTIVA" })

    await expect(
      service.reemplazarCursoArea(CURSO_ID, CURSO_AREA_ID, { nuevoAreaId: AREA_ID_BE }, ACTOR_ID),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})

// ─────────────────────────────────────────────────────────────────
// obtenerCursoArea
// ─────────────────────────────────────────────────────────────────

describe("CursosService.obtenerCursoArea", () => {
  let prisma: PrismaMock
  let service: CursosService

  beforeEach(() => {
    const built = buildService()
    prisma = built.prisma
    service = built.service
  })

  // Test 11
  it("calcula evaluablesCount correctamente con bloques mixtos", async () => {
    prisma.cursoArea.findUnique.mockResolvedValueOnce({
      id: CURSO_AREA_ID,
      cursoId: CURSO_ID,
      areaId: AREA_ID_FE,
      peso: decimal(50),
      puntajeObjetivo: 70,
      orden: 0,
      area: {
        id: AREA_ID_FE,
        nombre: "Frontend",
        color: "#0000ff",
        descripcion: null,
        estado: "ACTIVA",
      },
    })
    prisma.modulo.findMany.mockResolvedValueOnce([
      {
        id: "mod-1",
        titulo: "Frontend React",
        secciones: [
          {
            archivadoAt: null,
            bloques: [
              // evaluable QUIZ
              { archivadoAt: null, tipo: "QUIZ", codigoEvaluable: null },
              // evaluable CODIGO con TESTS
              { archivadoAt: null, tipo: "CODIGO", codigoEvaluable: "TESTS" },
              // NO evaluable CODIGO NINGUNO
              { archivadoAt: null, tipo: "CODIGO", codigoEvaluable: "NINGUNO" },
              // NO evaluable PARRAFO
              { archivadoAt: null, tipo: "PARRAFO", codigoEvaluable: null },
              // Bloque archivado (no cuenta)
              { archivadoAt: new Date(), tipo: "QUIZ", codigoEvaluable: null },
            ],
          },
          // Seccion archivada (no cuenta)
          {
            archivadoAt: new Date(),
            bloques: [{ archivadoAt: null, tipo: "QUIZ", codigoEvaluable: null }],
          },
        ],
      },
    ])

    const r = await service.obtenerCursoArea(CURSO_ID, CURSO_AREA_ID)

    // 1 QUIZ no archivado + 1 CODIGO TESTS no archivado = 2
    expect(r.modulos[0]?.evaluablesCount).toBe(2)
    // 2 secciones totales pero 1 archivada → 1 activa
    expect(r.modulos[0]?.seccionesCount).toBe(1)
  })
})
