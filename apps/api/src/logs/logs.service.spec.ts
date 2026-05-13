import type { ListarLogsAsignacionesQuery, ListarLogsCursosQuery } from "@nexott-learn/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { LogsService } from "./logs.service"

interface PrismaMock {
  readonly logCambioCurso: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly historicoEstadoAsignacion: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  return {
    logCambioCurso: { findMany: vi.fn(), count: vi.fn() },
    historicoEstadoAsignacion: { findMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn((ops: readonly Promise<unknown>[]) => Promise.all(ops)),
  }
}

function buildQueryCursos(overrides: Partial<ListarLogsCursosQuery> = {}): ListarLogsCursosQuery {
  return { page: 1, pageSize: 50, ...overrides }
}

function buildQueryAsignaciones(
  overrides: Partial<ListarLogsAsignacionesQuery> = {},
): ListarLogsAsignacionesQuery {
  return { page: 1, pageSize: 50, ...overrides }
}

function buildFilaCurso(
  overrides: Partial<{
    readonly id: string
    readonly cursoId: string
    readonly fecha: Date
    readonly autorUsuarioId: string
    readonly accion: string
    readonly motivo: string
    readonly previewImpacto: unknown
    readonly curso: { titulo: string } | null
    readonly autorUsuario: { colaborador: { email: string; nombre: string } | null } | null
  }> = {},
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: "44444444-0000-0000-0000-000000000001",
    cursoId: "aaaaaaaa-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-10T09:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    accion: "PUBLICACION",
    motivo: "Publicacion inicial",
    previewImpacto: null,
    curso: { titulo: "Curso demo" },
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
  }
  return { ...base, ...overrides }
}

function buildFilaHistorico(
  overrides: Partial<{
    readonly id: string
    readonly asignacionId: string
    readonly fecha: Date
    readonly autorUsuarioId: string
    readonly estadoAnterior: string
    readonly estadoNuevo: string
    readonly motivo: string | null
    readonly logCambioCursoId: string | null
    readonly autorUsuario: { colaborador: { email: string; nombre: string } | null } | null
  }> = {},
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: "55555555-0000-0000-0000-000000000001",
    asignacionId: "bbbbbbbb-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-11T11:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    estadoAnterior: "ASIGNADO",
    estadoNuevo: "EN_PROGRESO",
    motivo: null,
    logCambioCursoId: null,
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
  }
  return { ...base, ...overrides }
}

describe("LogsService.listarCambiosCurso", () => {
  let prisma: PrismaMock
  let service: LogsService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new LogsService(prisma as unknown as PrismaService)
  })

  it("paginacion default page=1 pageSize=50 -> skip=0 take=50 orden DESC", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)

    await service.listarCambiosCurso(buildQueryCursos())

    const call = prisma.logCambioCurso.findMany.mock.calls[0]?.[0] as {
      readonly skip: number
      readonly take: number
      readonly orderBy: { readonly fecha: "desc" }
      readonly where: Record<string, unknown>
    }
    expect(call.skip).toBe(0)
    expect(call.take).toBe(50)
    expect(call.orderBy).toEqual({ fecha: "desc" })
    expect(call.where).toEqual({})
  })

  it("filtro cursoId aplica WHERE cursoId", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)

    await service.listarCambiosCurso(
      buildQueryCursos({ cursoId: "aaaaaaaa-0000-0000-0000-000000000001" }),
    )

    const call = prisma.logCambioCurso.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly cursoId: string }
    }
    expect(call.where.cursoId).toBe("aaaaaaaa-0000-0000-0000-000000000001")
  })

  it("filtro accion=PUBLICACION aplica WHERE accion (enum)", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)

    await service.listarCambiosCurso(buildQueryCursos({ accion: "PUBLICACION" }))

    const call = prisma.logCambioCurso.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly accion: string }
    }
    expect(call.where.accion).toBe("PUBLICACION")
  })

  it("filtro autorUsuarioId aplica WHERE autorUsuarioId", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)

    await service.listarCambiosCurso(
      buildQueryCursos({ autorUsuarioId: "ffffffff-0000-0000-0000-000000000001" }),
    )

    const call = prisma.logCambioCurso.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly autorUsuarioId: string }
    }
    expect(call.where.autorUsuarioId).toBe("ffffffff-0000-0000-0000-000000000001")
  })

  it("rango temporal desde+hasta crea WHERE fecha gte/lt con Date", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)

    await service.listarCambiosCurso(
      buildQueryCursos({
        desde: "2026-05-01T00:00:00.000Z",
        hasta: "2026-05-13T00:00:00.000Z",
      }),
    )

    const call = prisma.logCambioCurso.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly fecha: { readonly gte: Date; readonly lt: Date } }
    }
    expect(call.where.fecha.gte).toBeInstanceOf(Date)
    expect(call.where.fecha.lt).toBeInstanceOf(Date)
    expect(call.where.fecha.gte.toISOString()).toBe("2026-05-01T00:00:00.000Z")
    expect(call.where.fecha.lt.toISOString()).toBe("2026-05-13T00:00:00.000Z")
  })

  it("paginacion page=3 pageSize=20 -> skip=40 take=20", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)

    await service.listarCambiosCurso(buildQueryCursos({ page: 3, pageSize: 20 }))

    const call = prisma.logCambioCurso.findMany.mock.calls[0]?.[0] as {
      readonly skip: number
      readonly take: number
    }
    expect(call.skip).toBe(40)
    expect(call.take).toBe(20)
  })

  it("LEFT join proyecta autorEmail/autorNombre + cursoTitulo cuando existen", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([
      buildFilaCurso({
        autorUsuario: {
          colaborador: { email: "carlos@nttdata.test", nombre: "Carlos" },
        },
        curso: { titulo: "Backend Avanzado" },
      }),
    ])
    prisma.logCambioCurso.count.mockResolvedValue(1)

    const out = await service.listarCambiosCurso(buildQueryCursos())

    expect(out.data[0]?.autorEmail).toBe("carlos@nttdata.test")
    expect(out.data[0]?.autorNombre).toBe("Carlos")
    expect(out.data[0]?.cursoTitulo).toBe("Backend Avanzado")
  })

  it("usuario sin colaborador deja autorEmail/Nombre en null (curso sin titulo tambien)", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([
      buildFilaCurso({
        autorUsuario: { colaborador: null },
        curso: null,
      }),
    ])
    prisma.logCambioCurso.count.mockResolvedValue(1)

    const out = await service.listarCambiosCurso(buildQueryCursos())

    expect(out.data[0]?.autorEmail).toBeNull()
    expect(out.data[0]?.autorNombre).toBeNull()
    expect(out.data[0]?.cursoTitulo).toBeNull()
  })

  it("previewImpacto array o primitivos se normaliza a null", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([
      buildFilaCurso({ previewImpacto: ["x", "y"] }),
    ])
    prisma.logCambioCurso.count.mockResolvedValue(1)

    const out = await service.listarCambiosCurso(buildQueryCursos())

    expect(out.data[0]?.previewImpacto).toBeNull()
  })

  it("previewImpacto objeto se preserva como Record<string, unknown>", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([
      buildFilaCurso({ previewImpacto: { afectados: 3, modulos: ["a"] } }),
    ])
    prisma.logCambioCurso.count.mockResolvedValue(1)

    const out = await service.listarCambiosCurso(buildQueryCursos())

    expect(out.data[0]?.previewImpacto).toEqual({ afectados: 3, modulos: ["a"] })
  })

  it("respuesta paginada incluye meta total + totalPages correctos", async () => {
    prisma.logCambioCurso.findMany.mockResolvedValue([buildFilaCurso()])
    prisma.logCambioCurso.count.mockResolvedValue(123)

    const out = await service.listarCambiosCurso(buildQueryCursos({ page: 2, pageSize: 50 }))

    expect(out.meta).toEqual({ page: 2, pageSize: 50, total: 123, totalPages: 3 })
  })
})

describe("LogsService.listarHistoricoAsignacion", () => {
  let prisma: PrismaMock
  let service: LogsService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new LogsService(prisma as unknown as PrismaService)
  })

  it("paginacion default page=1 pageSize=50 orden DESC where vacio", async () => {
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(0)

    await service.listarHistoricoAsignacion(buildQueryAsignaciones())

    const call = prisma.historicoEstadoAsignacion.findMany.mock.calls[0]?.[0] as {
      readonly skip: number
      readonly take: number
      readonly orderBy: { readonly fecha: "desc" }
      readonly where: Record<string, unknown>
    }
    expect(call.skip).toBe(0)
    expect(call.take).toBe(50)
    expect(call.orderBy).toEqual({ fecha: "desc" })
    expect(call.where).toEqual({})
  })

  it("filtro asignacionId + estadoNuevo + autorUsuarioId combinados (AND)", async () => {
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(0)

    await service.listarHistoricoAsignacion(
      buildQueryAsignaciones({
        asignacionId: "bbbbbbbb-0000-0000-0000-000000000001",
        estadoNuevo: "LISTO",
        autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
      }),
    )

    const call = prisma.historicoEstadoAsignacion.findMany.mock.calls[0]?.[0] as {
      readonly where: Record<string, unknown>
    }
    expect(call.where).toEqual({
      asignacionId: "bbbbbbbb-0000-0000-0000-000000000001",
      estadoNuevo: "LISTO",
      autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    })
  })

  it("rango temporal solo hasta no setea gte", async () => {
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(0)

    await service.listarHistoricoAsignacion(
      buildQueryAsignaciones({ hasta: "2026-05-13T00:00:00.000Z" }),
    )

    const call = prisma.historicoEstadoAsignacion.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly fecha: { readonly gte?: Date; readonly lt: Date } }
    }
    expect(call.where.fecha.lt).toBeInstanceOf(Date)
    expect(call.where.fecha.gte).toBeUndefined()
  })

  it("LEFT join autorEmail/Nombre proyectado; logCambioCursoId pasa-through", async () => {
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([
      buildFilaHistorico({
        autorUsuario: { colaborador: { email: "carlos@nttdata.test", nombre: "Carlos" } },
        logCambioCursoId: "44444444-0000-0000-0000-000000000099",
        motivo: "Cierre masivo",
      }),
    ])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(1)

    const out = await service.listarHistoricoAsignacion(buildQueryAsignaciones())

    expect(out.data[0]?.autorEmail).toBe("carlos@nttdata.test")
    expect(out.data[0]?.autorNombre).toBe("Carlos")
    expect(out.data[0]?.logCambioCursoId).toBe("44444444-0000-0000-0000-000000000099")
    expect(out.data[0]?.motivo).toBe("Cierre masivo")
  })

  it("colaborador inexistente deja autorEmail/Nombre en null", async () => {
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([
      buildFilaHistorico({ autorUsuario: { colaborador: null } }),
    ])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(1)

    const out = await service.listarHistoricoAsignacion(buildQueryAsignaciones())

    expect(out.data[0]?.autorEmail).toBeNull()
    expect(out.data[0]?.autorNombre).toBeNull()
  })

  it("respuesta paginada con meta correcta (total=0 -> totalPages=0)", async () => {
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(0)

    const out = await service.listarHistoricoAsignacion(buildQueryAsignaciones())

    expect(out.meta).toEqual({ page: 1, pageSize: 50, total: 0, totalPages: 0 })
  })
})
