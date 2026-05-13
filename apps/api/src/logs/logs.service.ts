import { Injectable } from "@nestjs/common"
import type {
  HistoricoEstadoAsignacionResumen,
  ListarLogsAjustesPlanQuery,
  ListarLogsAsignacionesQuery,
  ListarLogsConsultasQuery,
  ListarLogsCursosQuery,
  ListarLogsModulosQuery,
  ListarLogsSkillsQuery,
  LogAjustePlanResumen,
  LogCambioCursoResumen,
  LogConsultaResumen,
  LogModuloEstadoResumen,
  LogSkillEventoResumen,
} from "@nexott-learn/shared-types"
import type { AccionAjustePlan, AccionLogCurso, EstadoModulo, Prisma } from "@prisma/client"
import { type Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * `LogsService` — Slice futuro B (foundation P-B-a + ampliacion P-B-b).
 *
 * Lectura admin paginada de seis visores especificos:
 *   - `log_cambios_curso` (P-B-a).
 *   - `historico_estados_asignacion` (P-B-a).
 *   - `historico_renombrados_skill` + `historico_cambios_area_skill` unificados (P-B-b).
 *   - `historico_estados_modulo` (P-B-b).
 *   - `ajustes_plan` (P-B-b).
 *   - `consultas_logs` (meta-auditoria, P-B-b).
 *
 * Todos los metodos resuelven `autorEmail`/`autorNombre` con LEFT join sobre
 * `Usuario` -> `Colaborador` (OWASP A09: selects explicitos sin campos
 * sensibles). Paginacion con cap duro 200 ya aplicado por los schemas Zod.
 * Identidad SIEMPRE de sesion (resuelto en controller).
 */
@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listarCambiosCurso(
    query: ListarLogsCursosQuery,
  ): Promise<Paginated<LogCambioCursoResumen>> {
    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = construirWhereCursos(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.logCambioCurso.findMany({
        where,
        select: selectLogCambioCurso,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.logCambioCurso.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toLogCambioCursoResumen), total, page, pageSize)
  }

  async listarHistoricoAsignacion(
    query: ListarLogsAsignacionesQuery,
  ): Promise<Paginated<HistoricoEstadoAsignacionResumen>> {
    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = construirWhereAsignaciones(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.historicoEstadoAsignacion.findMany({
        where,
        select: selectHistoricoEstadoAsignacion,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.historicoEstadoAsignacion.count({ where }),
    ])

    return buildPaginatedResponse(
      filas.map(toHistoricoEstadoAsignacionResumen),
      total,
      page,
      pageSize,
    )
  }

  /**
   * Visor unificado de skills: combina `historico_renombrados_skill` con
   * `historico_cambios_area_skill` via `tipoEvento`. Estrategia de paginacion
   * en memoria:
   *   1. Traer `skip + pageSize` filas DESC de cada tabla (todas las
   *      candidatas globales caben aqui porque ambas listas estan ordenadas).
   *   2. Mergear por `fecha DESC` y slice [skip .. skip + pageSize].
   *   3. `total` = suma de counts de las tablas consultadas.
   *
   * Si `tipoEvento` esta presente, solo se consulta esa tabla.
   */
  async listarEventosSkill(
    query: ListarLogsSkillsQuery,
  ): Promise<Paginated<LogSkillEventoResumen>> {
    const { page, pageSize, skip } = resolvePaginacion(query)
    const takeMerge = skip + pageSize
    const filtros = construirFiltrosSkills(query)

    const necesitaRenombrados = !query.tipoEvento || query.tipoEvento === "RENOMBRADO"
    const necesitaCambiosArea = !query.tipoEvento || query.tipoEvento === "CAMBIO_AREA"

    const operaciones: Prisma.PrismaPromise<unknown>[] = []
    if (necesitaRenombrados) {
      operaciones.push(
        this.prisma.historicoRenombradoSkill.findMany({
          where: filtros.renombrados,
          select: selectHistoricoRenombrado,
          orderBy: { fecha: "desc" },
          take: takeMerge,
        }),
        this.prisma.historicoRenombradoSkill.count({ where: filtros.renombrados }),
      )
    }
    if (necesitaCambiosArea) {
      operaciones.push(
        this.prisma.historicoCambiosAreaSkill.findMany({
          where: filtros.cambiosArea,
          select: selectHistoricoCambiosArea,
          orderBy: { fecha: "desc" },
          take: takeMerge,
        }),
        this.prisma.historicoCambiosAreaSkill.count({ where: filtros.cambiosArea }),
      )
    }

    const resultados = await this.prisma.$transaction(operaciones)

    let cursor = 0
    let renombradosFilas: HistoricoRenombradoProyectado[] = []
    let renombradosCount = 0
    let cambiosAreaFilas: HistoricoCambiosAreaProyectado[] = []
    let cambiosAreaCount = 0
    if (necesitaRenombrados) {
      renombradosFilas = resultados[cursor++] as HistoricoRenombradoProyectado[]
      renombradosCount = resultados[cursor++] as number
    }
    if (necesitaCambiosArea) {
      cambiosAreaFilas = resultados[cursor++] as HistoricoCambiosAreaProyectado[]
      cambiosAreaCount = resultados[cursor++] as number
    }

    const mergeado: LogSkillEventoResumen[] = [
      ...renombradosFilas.map(toResumenRenombrado),
      ...cambiosAreaFilas.map(toResumenCambioArea),
    ].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    const pageSlice = mergeado.slice(skip, skip + pageSize)
    const total = renombradosCount + cambiosAreaCount

    return buildPaginatedResponse(pageSlice, total, page, pageSize)
  }

  async listarEventosModulo(
    query: ListarLogsModulosQuery,
  ): Promise<Paginated<LogModuloEstadoResumen>> {
    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = construirWhereModulos(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.historicoEstadoModulo.findMany({
        where,
        select: selectHistoricoEstadoModulo,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.historicoEstadoModulo.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toModuloEstadoResumen), total, page, pageSize)
  }

  async listarAjustesPlan(
    query: ListarLogsAjustesPlanQuery,
  ): Promise<Paginated<LogAjustePlanResumen>> {
    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = construirWhereAjustesPlan(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.ajustePlan.findMany({
        where,
        select: selectAjustePlan,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.ajustePlan.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toAjustePlanResumen), total, page, pageSize)
  }

  async listarConsultas(query: ListarLogsConsultasQuery): Promise<Paginated<LogConsultaResumen>> {
    const { page, pageSize, skip, take } = resolvePaginacion(query)
    const where = construirWhereConsultas(query)

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.consultaLog.findMany({
        where,
        select: selectConsultaLog,
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      this.prisma.consultaLog.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toConsultaLogResumen), total, page, pageSize)
  }
}

// =============================================================================
// log_cambios_curso
// =============================================================================

const selectLogCambioCurso = {
  id: true,
  cursoId: true,
  fecha: true,
  autorUsuarioId: true,
  accion: true,
  motivo: true,
  previewImpacto: true,
  curso: { select: { titulo: true } },
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type LogCambioCursoProyectado = Prisma.LogCambioCursoGetPayload<{
  select: typeof selectLogCambioCurso
}>

function construirWhereCursos(
  query: Omit<ListarLogsCursosQuery, "page" | "pageSize">,
): Prisma.LogCambioCursoWhereInput {
  const where: Prisma.LogCambioCursoWhereInput = {}
  if (query.cursoId) {
    where.cursoId = query.cursoId
  }
  if (query.autorUsuarioId) {
    where.autorUsuarioId = query.autorUsuarioId
  }
  if (query.accion) {
    // El enum literal de shared-types se mantiene en sync manual con el enum
    // Prisma `AccionLogCurso`. El schema Zod ya valido que el string esta en
    // ACCIONES_LOG_CURSO.
    where.accion = query.accion as AccionLogCurso
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    where.fecha = rango
  }
  return where
}

function toLogCambioCursoResumen(row: LogCambioCursoProyectado): LogCambioCursoResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    cursoId: row.cursoId,
    cursoTitulo: row.curso?.titulo ?? null,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    accion: row.accion,
    motivo: row.motivo,
    previewImpacto: normalizarJson(row.previewImpacto),
  }
}

// =============================================================================
// historico_estados_asignacion
// =============================================================================

const selectHistoricoEstadoAsignacion = {
  id: true,
  asignacionId: true,
  fecha: true,
  autorUsuarioId: true,
  estadoAnterior: true,
  estadoNuevo: true,
  motivo: true,
  logCambioCursoId: true,
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type HistoricoEstadoAsignacionProyectado = Prisma.HistoricoEstadoAsignacionGetPayload<{
  select: typeof selectHistoricoEstadoAsignacion
}>

function construirWhereAsignaciones(
  query: Omit<ListarLogsAsignacionesQuery, "page" | "pageSize">,
): Prisma.HistoricoEstadoAsignacionWhereInput {
  const where: Prisma.HistoricoEstadoAsignacionWhereInput = {}
  if (query.asignacionId) {
    where.asignacionId = query.asignacionId
  }
  if (query.autorUsuarioId) {
    where.autorUsuarioId = query.autorUsuarioId
  }
  if (query.estadoNuevo) {
    where.estadoNuevo = query.estadoNuevo
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    where.fecha = rango
  }
  return where
}

function toHistoricoEstadoAsignacionResumen(
  row: HistoricoEstadoAsignacionProyectado,
): HistoricoEstadoAsignacionResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    asignacionId: row.asignacionId,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    estadoAnterior: row.estadoAnterior,
    estadoNuevo: row.estadoNuevo,
    motivo: row.motivo,
    logCambioCursoId: row.logCambioCursoId,
  }
}

// =============================================================================
// historico_renombrados_skill + historico_cambios_area_skill (union P-B-b)
// =============================================================================

const selectHistoricoRenombrado = {
  id: true,
  skillId: true,
  fecha: true,
  autorUsuarioId: true,
  etiquetaAnterior: true,
  etiquetaNueva: true,
  motivo: true,
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

const selectHistoricoCambiosArea = {
  id: true,
  skillId: true,
  fecha: true,
  autorUsuarioId: true,
  areaAnteriorId: true,
  areaNuevaId: true,
  motivo: true,
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type HistoricoRenombradoProyectado = Prisma.HistoricoRenombradoSkillGetPayload<{
  select: typeof selectHistoricoRenombrado
}>
type HistoricoCambiosAreaProyectado = Prisma.HistoricoCambiosAreaSkillGetPayload<{
  select: typeof selectHistoricoCambiosArea
}>

function construirFiltrosSkills(query: ListarLogsSkillsQuery): {
  readonly renombrados: Prisma.HistoricoRenombradoSkillWhereInput
  readonly cambiosArea: Prisma.HistoricoCambiosAreaSkillWhereInput
} {
  const renombrados: Prisma.HistoricoRenombradoSkillWhereInput = {}
  const cambiosArea: Prisma.HistoricoCambiosAreaSkillWhereInput = {}
  if (query.skillId) {
    renombrados.skillId = query.skillId
    cambiosArea.skillId = query.skillId
  }
  if (query.autorUsuarioId) {
    renombrados.autorUsuarioId = query.autorUsuarioId
    cambiosArea.autorUsuarioId = query.autorUsuarioId
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    renombrados.fecha = rango
    cambiosArea.fecha = rango
  }
  return { renombrados, cambiosArea }
}

function toResumenRenombrado(row: HistoricoRenombradoProyectado): LogSkillEventoResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    skillId: row.skillId,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    tipoEvento: "RENOMBRADO",
    motivo: row.motivo,
    etiquetaAnterior: row.etiquetaAnterior,
    etiquetaNueva: row.etiquetaNueva,
    areaAnteriorId: null,
    areaNuevaId: null,
  }
}

function toResumenCambioArea(row: HistoricoCambiosAreaProyectado): LogSkillEventoResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    skillId: row.skillId,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    tipoEvento: "CAMBIO_AREA",
    motivo: row.motivo,
    etiquetaAnterior: null,
    etiquetaNueva: null,
    areaAnteriorId: row.areaAnteriorId,
    areaNuevaId: row.areaNuevaId,
  }
}

// =============================================================================
// historico_estados_modulo
// =============================================================================

const selectHistoricoEstadoModulo = {
  id: true,
  moduloId: true,
  fecha: true,
  autorUsuarioId: true,
  estadoAnterior: true,
  estadoNuevo: true,
  motivo: true,
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type HistoricoEstadoModuloProyectado = Prisma.HistoricoEstadoModuloGetPayload<{
  select: typeof selectHistoricoEstadoModulo
}>

function construirWhereModulos(
  query: ListarLogsModulosQuery,
): Prisma.HistoricoEstadoModuloWhereInput {
  const where: Prisma.HistoricoEstadoModuloWhereInput = {}
  if (query.moduloId) {
    where.moduloId = query.moduloId
  }
  if (query.autorUsuarioId) {
    where.autorUsuarioId = query.autorUsuarioId
  }
  if (query.estadoNuevo) {
    where.estadoNuevo = query.estadoNuevo as EstadoModulo
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    where.fecha = rango
  }
  return where
}

function toModuloEstadoResumen(row: HistoricoEstadoModuloProyectado): LogModuloEstadoResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    moduloId: row.moduloId,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    estadoAnterior: row.estadoAnterior,
    estadoNuevo: row.estadoNuevo,
    motivo: row.motivo,
  }
}

// =============================================================================
// ajustes_plan
// =============================================================================

const selectAjustePlan = {
  id: true,
  planId: true,
  fecha: true,
  autorUsuarioId: true,
  accion: true,
  motivo: true,
  seccionId: true,
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type AjustePlanProyectado = Prisma.AjustePlanGetPayload<{ select: typeof selectAjustePlan }>

function construirWhereAjustesPlan(query: ListarLogsAjustesPlanQuery): Prisma.AjustePlanWhereInput {
  const where: Prisma.AjustePlanWhereInput = {}
  if (query.planId) {
    where.planId = query.planId
  }
  if (query.seccionId) {
    where.seccionId = query.seccionId
  }
  if (query.autorUsuarioId) {
    where.autorUsuarioId = query.autorUsuarioId
  }
  if (query.accion) {
    where.accion = query.accion as AccionAjustePlan
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    where.fecha = rango
  }
  return where
}

function toAjustePlanResumen(row: AjustePlanProyectado): LogAjustePlanResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    planId: row.planId,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    accion: row.accion,
    motivo: row.motivo,
    seccionId: row.seccionId,
  }
}

// =============================================================================
// consultas_logs (meta-auditoria)
// =============================================================================

const selectConsultaLog = {
  id: true,
  fecha: true,
  autorUsuarioId: true,
  endpoint: true,
  queryParams: true,
  latenciaMs: true,
  autorUsuario: {
    select: {
      colaborador: { select: { email: true, nombre: true } },
    },
  },
} as const

type ConsultaLogProyectado = Prisma.ConsultaLogGetPayload<{ select: typeof selectConsultaLog }>

function construirWhereConsultas(query: ListarLogsConsultasQuery): Prisma.ConsultaLogWhereInput {
  const where: Prisma.ConsultaLogWhereInput = {}
  if (query.autorUsuarioId) {
    where.autorUsuarioId = query.autorUsuarioId
  }
  if (query.endpoint) {
    where.endpoint = query.endpoint
  }
  if (query.desde || query.hasta) {
    const rango: Prisma.DateTimeFilter = {}
    if (query.desde) {
      rango.gte = new Date(query.desde)
    }
    if (query.hasta) {
      rango.lt = new Date(query.hasta)
    }
    where.fecha = rango
  }
  return where
}

function toConsultaLogResumen(row: ConsultaLogProyectado): LogConsultaResumen {
  const colaborador = row.autorUsuario?.colaborador ?? null
  return {
    id: row.id,
    fecha: row.fecha.toISOString(),
    autorUsuarioId: row.autorUsuarioId,
    autorEmail: colaborador?.email ?? null,
    autorNombre: colaborador?.nombre ?? null,
    endpoint: row.endpoint,
    queryParams: normalizarJson(row.queryParams) ?? {},
    latenciaMs: row.latenciaMs,
  }
}

// =============================================================================
// helpers compartidos
// =============================================================================

function normalizarJson(raw: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  return raw as Record<string, unknown>
}
