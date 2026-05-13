import type {
  ListarLogsAjustesPlanQuery,
  ListarLogsAsignacionesQuery,
  ListarLogsConsultasQuery,
  ListarLogsCursosQuery,
  ListarLogsModulosQuery,
  ListarLogsSkillsQuery,
} from "@nexott-learn/shared-types"
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
  readonly historicoRenombradoSkill: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly historicoCambiosAreaSkill: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly historicoEstadoModulo: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly ajustePlan: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly consultaLog: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  return {
    logCambioCurso: { findMany: vi.fn(), count: vi.fn() },
    historicoEstadoAsignacion: { findMany: vi.fn(), count: vi.fn() },
    historicoRenombradoSkill: { findMany: vi.fn(), count: vi.fn() },
    historicoCambiosAreaSkill: { findMany: vi.fn(), count: vi.fn() },
    historicoEstadoModulo: { findMany: vi.fn(), count: vi.fn() },
    ajustePlan: { findMany: vi.fn(), count: vi.fn() },
    consultaLog: { findMany: vi.fn(), count: vi.fn() },
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

// =============================================================================
// P-B-b: 4 visores adicionales
// =============================================================================

function buildQuerySkills(overrides: Partial<ListarLogsSkillsQuery> = {}): ListarLogsSkillsQuery {
  return { page: 1, pageSize: 50, ...overrides }
}

function buildQueryModulos(
  overrides: Partial<ListarLogsModulosQuery> = {},
): ListarLogsModulosQuery {
  return { page: 1, pageSize: 50, ...overrides }
}

function buildQueryAjustes(
  overrides: Partial<ListarLogsAjustesPlanQuery> = {},
): ListarLogsAjustesPlanQuery {
  return { page: 1, pageSize: 50, ...overrides }
}

function buildQueryConsultas(
  overrides: Partial<ListarLogsConsultasQuery> = {},
): ListarLogsConsultasQuery {
  return { page: 1, pageSize: 50, ...overrides }
}

function buildFilaRenombrado(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "88888888-0000-0000-0000-000000000001",
    skillId: "ccccccaa-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-10T09:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    etiquetaAnterior: "Node 18",
    etiquetaNueva: "Node 20",
    motivo: null,
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
    ...overrides,
  }
}

function buildFilaCambioArea(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "99999999-0000-0000-0000-000000000001",
    skillId: "ccccccaa-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-11T09:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    areaAnteriorId: "dddddd00-0000-0000-0000-000000000001",
    areaNuevaId: "dddddd00-0000-0000-0000-000000000002",
    motivo: "Reclasificacion",
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
    ...overrides,
  }
}

function buildFilaModulo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    moduloId: "22222222-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-12T09:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    estadoAnterior: "ACTIVO",
    estadoNuevo: "ARCHIVADO",
    motivo: "Refactor",
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
    ...overrides,
  }
}

function buildFilaAjuste(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "bbbbbbbb-0000-0000-0000-000000000001",
    planId: "eeeeeeee-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-13T09:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    accion: "AGREGAR",
    motivo: "Anadir seccion Node",
    seccionId: "22222222-0000-0000-0000-000000000003",
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
    ...overrides,
  }
}

function buildFilaConsulta(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "cccccccc-0000-0000-0000-000000000001",
    fecha: new Date("2026-05-13T10:00:00.000Z"),
    autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    endpoint: "/admin/logs/cursos",
    queryParams: { page: 1, pageSize: 50 },
    latenciaMs: 42,
    autorUsuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
    ...overrides,
  }
}

describe("LogsService.listarEventosSkill", () => {
  let prisma: PrismaMock
  let service: LogsService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new LogsService(prisma as unknown as PrismaService)
  })

  it("sin tipoEvento -> consulta ambas tablas y mergea por fecha DESC", async () => {
    const renombrado = buildFilaRenombrado({ fecha: new Date("2026-05-10T09:00:00.000Z") })
    const cambioArea = buildFilaCambioArea({ fecha: new Date("2026-05-11T09:00:00.000Z") })
    prisma.historicoRenombradoSkill.findMany.mockResolvedValue([renombrado])
    prisma.historicoRenombradoSkill.count.mockResolvedValue(1)
    prisma.historicoCambiosAreaSkill.findMany.mockResolvedValue([cambioArea])
    prisma.historicoCambiosAreaSkill.count.mockResolvedValue(1)

    const out = await service.listarEventosSkill(buildQuerySkills())

    expect(prisma.historicoRenombradoSkill.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.historicoCambiosAreaSkill.findMany).toHaveBeenCalledTimes(1)
    expect(out.data).toHaveLength(2)
    expect(out.data[0]?.tipoEvento).toBe("CAMBIO_AREA") // mas reciente
    expect(out.data[1]?.tipoEvento).toBe("RENOMBRADO")
    expect(out.meta.total).toBe(2)
  })

  it("tipoEvento=RENOMBRADO -> omite la otra tabla y total = solo renombrados", async () => {
    prisma.historicoRenombradoSkill.findMany.mockResolvedValue([buildFilaRenombrado()])
    prisma.historicoRenombradoSkill.count.mockResolvedValue(5)

    const out = await service.listarEventosSkill(buildQuerySkills({ tipoEvento: "RENOMBRADO" }))

    expect(prisma.historicoRenombradoSkill.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.historicoCambiosAreaSkill.findMany).not.toHaveBeenCalled()
    expect(prisma.historicoCambiosAreaSkill.count).not.toHaveBeenCalled()
    expect(out.meta.total).toBe(5)
    expect(out.data[0]?.tipoEvento).toBe("RENOMBRADO")
    expect(out.data[0]?.etiquetaAnterior).toBe("Node 18")
    expect(out.data[0]?.etiquetaNueva).toBe("Node 20")
    expect(out.data[0]?.areaAnteriorId).toBeNull()
  })

  it("tipoEvento=CAMBIO_AREA -> omite la otra tabla, proyecta areaAnterior/Nueva", async () => {
    prisma.historicoCambiosAreaSkill.findMany.mockResolvedValue([buildFilaCambioArea()])
    prisma.historicoCambiosAreaSkill.count.mockResolvedValue(3)

    const out = await service.listarEventosSkill(buildQuerySkills({ tipoEvento: "CAMBIO_AREA" }))

    expect(prisma.historicoRenombradoSkill.findMany).not.toHaveBeenCalled()
    expect(out.meta.total).toBe(3)
    expect(out.data[0]?.tipoEvento).toBe("CAMBIO_AREA")
    expect(out.data[0]?.areaAnteriorId).toBe("dddddd00-0000-0000-0000-000000000001")
    expect(out.data[0]?.areaNuevaId).toBe("dddddd00-0000-0000-0000-000000000002")
    expect(out.data[0]?.etiquetaAnterior).toBeNull()
  })

  it("filtros AND aplican a las dos tablas (skillId + autorUsuarioId)", async () => {
    prisma.historicoRenombradoSkill.findMany.mockResolvedValue([])
    prisma.historicoRenombradoSkill.count.mockResolvedValue(0)
    prisma.historicoCambiosAreaSkill.findMany.mockResolvedValue([])
    prisma.historicoCambiosAreaSkill.count.mockResolvedValue(0)

    await service.listarEventosSkill(
      buildQuerySkills({
        skillId: "ccccccaa-0000-0000-0000-000000000099",
        autorUsuarioId: "ffffffff-0000-0000-0000-000000000099",
      }),
    )

    const callRen = prisma.historicoRenombradoSkill.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly skillId: string; readonly autorUsuarioId: string }
    }
    expect(callRen.where.skillId).toBe("ccccccaa-0000-0000-0000-000000000099")
    expect(callRen.where.autorUsuarioId).toBe("ffffffff-0000-0000-0000-000000000099")
    const callCam = prisma.historicoCambiosAreaSkill.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly skillId: string; readonly autorUsuarioId: string }
    }
    expect(callCam.where.skillId).toBe("ccccccaa-0000-0000-0000-000000000099")
    expect(callCam.where.autorUsuarioId).toBe("ffffffff-0000-0000-0000-000000000099")
  })

  it("paginacion page=2 pageSize=10 -> take=20 en cada tabla y slice [10..20]", async () => {
    const filas = Array.from({ length: 20 }, (_, i) =>
      buildFilaRenombrado({
        id: `88888888-0000-0000-0000-0000000000${String(i + 1).padStart(2, "0")}`,
        fecha: new Date(2026, 0, 1 + i),
      }),
    )
    prisma.historicoRenombradoSkill.findMany.mockResolvedValue(filas)
    prisma.historicoRenombradoSkill.count.mockResolvedValue(50)
    prisma.historicoCambiosAreaSkill.findMany.mockResolvedValue([])
    prisma.historicoCambiosAreaSkill.count.mockResolvedValue(0)

    const out = await service.listarEventosSkill(buildQuerySkills({ page: 2, pageSize: 10 }))

    const call = prisma.historicoRenombradoSkill.findMany.mock.calls[0]?.[0] as {
      readonly take: number
    }
    expect(call.take).toBe(20)
    expect(out.data).toHaveLength(10)
    expect(out.meta).toEqual({ page: 2, pageSize: 10, total: 50, totalPages: 5 })
  })
})

describe("LogsService.listarEventosModulo", () => {
  let prisma: PrismaMock
  let service: LogsService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new LogsService(prisma as unknown as PrismaService)
  })

  it("paginacion default + orden DESC + where vacio", async () => {
    prisma.historicoEstadoModulo.findMany.mockResolvedValue([])
    prisma.historicoEstadoModulo.count.mockResolvedValue(0)

    await service.listarEventosModulo(buildQueryModulos())

    const call = prisma.historicoEstadoModulo.findMany.mock.calls[0]?.[0] as {
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

  it("filtros AND combinados (moduloId + estadoNuevo + autorUsuarioId)", async () => {
    prisma.historicoEstadoModulo.findMany.mockResolvedValue([])
    prisma.historicoEstadoModulo.count.mockResolvedValue(0)

    await service.listarEventosModulo(
      buildQueryModulos({
        moduloId: "22222222-0000-0000-0000-000000000001",
        estadoNuevo: "ARCHIVADO",
        autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
      }),
    )

    const call = prisma.historicoEstadoModulo.findMany.mock.calls[0]?.[0] as {
      readonly where: Record<string, unknown>
    }
    expect(call.where).toEqual({
      moduloId: "22222222-0000-0000-0000-000000000001",
      estadoNuevo: "ARCHIVADO",
      autorUsuarioId: "ffffffff-0000-0000-0000-000000000001",
    })
  })

  it("LEFT join proyecta autorEmail/Nombre y motivo pasa-through", async () => {
    prisma.historicoEstadoModulo.findMany.mockResolvedValue([buildFilaModulo()])
    prisma.historicoEstadoModulo.count.mockResolvedValue(1)

    const out = await service.listarEventosModulo(buildQueryModulos())

    expect(out.data[0]?.autorEmail).toBe("admin@nttdata.test")
    expect(out.data[0]?.autorNombre).toBe("Admin")
    expect(out.data[0]?.estadoAnterior).toBe("ACTIVO")
    expect(out.data[0]?.estadoNuevo).toBe("ARCHIVADO")
    expect(out.data[0]?.motivo).toBe("Refactor")
  })
})

describe("LogsService.listarAjustesPlan", () => {
  let prisma: PrismaMock
  let service: LogsService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new LogsService(prisma as unknown as PrismaService)
  })

  it("paginacion default + where vacio + orden DESC", async () => {
    prisma.ajustePlan.findMany.mockResolvedValue([])
    prisma.ajustePlan.count.mockResolvedValue(0)

    await service.listarAjustesPlan(buildQueryAjustes())

    const call = prisma.ajustePlan.findMany.mock.calls[0]?.[0] as {
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

  it("filtros AND combinados (planId + seccionId + accion)", async () => {
    prisma.ajustePlan.findMany.mockResolvedValue([])
    prisma.ajustePlan.count.mockResolvedValue(0)

    await service.listarAjustesPlan(
      buildQueryAjustes({
        planId: "eeeeeeee-0000-0000-0000-000000000001",
        seccionId: "22222222-0000-0000-0000-000000000003",
        accion: "AGREGAR",
      }),
    )

    const call = prisma.ajustePlan.findMany.mock.calls[0]?.[0] as {
      readonly where: Record<string, unknown>
    }
    expect(call.where).toEqual({
      planId: "eeeeeeee-0000-0000-0000-000000000001",
      seccionId: "22222222-0000-0000-0000-000000000003",
      accion: "AGREGAR",
    })
  })

  it("proyecta seccionId nullable + accion + autorEmail", async () => {
    prisma.ajustePlan.findMany.mockResolvedValue([
      buildFilaAjuste({ seccionId: null, accion: "EXIMIR" }),
    ])
    prisma.ajustePlan.count.mockResolvedValue(1)

    const out = await service.listarAjustesPlan(buildQueryAjustes())

    expect(out.data[0]?.seccionId).toBeNull()
    expect(out.data[0]?.accion).toBe("EXIMIR")
    expect(out.data[0]?.autorEmail).toBe("admin@nttdata.test")
  })
})

describe("LogsService.listarConsultas", () => {
  let prisma: PrismaMock
  let service: LogsService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new LogsService(prisma as unknown as PrismaService)
  })

  it("paginacion default + orden DESC + where vacio", async () => {
    prisma.consultaLog.findMany.mockResolvedValue([])
    prisma.consultaLog.count.mockResolvedValue(0)

    await service.listarConsultas(buildQueryConsultas())

    const call = prisma.consultaLog.findMany.mock.calls[0]?.[0] as {
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

  it("filtro endpoint hace match exacto + queryParams se preserva como Record", async () => {
    prisma.consultaLog.findMany.mockResolvedValue([buildFilaConsulta()])
    prisma.consultaLog.count.mockResolvedValue(1)

    const out = await service.listarConsultas(
      buildQueryConsultas({ endpoint: "/admin/logs/cursos" }),
    )

    const call = prisma.consultaLog.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly endpoint: string }
    }
    expect(call.where.endpoint).toBe("/admin/logs/cursos")
    expect(out.data[0]?.queryParams).toEqual({ page: 1, pageSize: 50 })
    expect(out.data[0]?.latenciaMs).toBe(42)
  })

  it("queryParams no-objeto se normaliza a objeto vacio", async () => {
    prisma.consultaLog.findMany.mockResolvedValue([
      buildFilaConsulta({ queryParams: ["a", "b"], latenciaMs: null }),
    ])
    prisma.consultaLog.count.mockResolvedValue(1)

    const out = await service.listarConsultas(buildQueryConsultas())

    expect(out.data[0]?.queryParams).toEqual({})
    expect(out.data[0]?.latenciaMs).toBeNull()
  })
})
