import { Injectable } from "@nestjs/common"
import type {
  HistoricoEstadoAsignacionResumen,
  ListarLogsAsignacionesQuery,
  ListarLogsCursosQuery,
  LogCambioCursoResumen,
} from "@nexott-learn/shared-types"
import type { AccionLogCurso, Prisma } from "@prisma/client"
import { type Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * `LogsService` — Slice futuro B foundation.
 *
 * Lectura admin paginada de:
 *   - `log_cambios_curso` (visor de cambios de configuracion del curso).
 *   - `historico_estados_asignacion` (visor de transiciones de estado).
 *
 * Ambos endpoints usan LEFT join con `Usuario` -> `Colaborador` para resolver
 * `autorEmail` / `autorNombre` con el mismo patron del visor de auditoria
 * (D-S12-A3). Los selects son explicitos (OWASP A09): solo se exponen las
 * columnas que el admin necesita para forensia.
 *
 * Reglas duras:
 *   - Identidad SIEMPRE de sesion (resuelto en el controller). El service
 *     trabaja con filtros ya validados por Zod.
 *   - Pageado con cap duro 200 (ya aplicado por el schema Zod).
 *   - Las lecturas se auditan en `consultas_logs` desde el controller via
 *     `ConsultasLogService.registrar()` (fire-and-forget post-200).
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

function normalizarJson(raw: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  return raw as Record<string, unknown>
}
