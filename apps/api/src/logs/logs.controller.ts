import { Controller, Get, InternalServerErrorException, Query } from "@nestjs/common"
import {
  type HistoricoEstadoAsignacionResumen,
  type ListarLogsAsignacionesQuery,
  type ListarLogsCursosQuery,
  type LogCambioCursoResumen,
  listarLogsAsignacionesQuerySchema,
  listarLogsCursosQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import type { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import type { SesionUsuario } from "../common/types/sesion.types"
import { ConsultasLogService } from "../reportes/consultas-log.service"
import { LogsService } from "./logs.service"

/**
 * `LogsController` — Slice futuro B foundation.
 *
 * Visor admin con dos endpoints especificos:
 *   1. `GET /admin/logs/cursos`        — paginado `log_cambios_curso`.
 *   2. `GET /admin/logs/asignaciones`  — paginado `historico_estados_asignacion`.
 *
 * Cada consulta exitosa registra una fila en `consultas_logs` via
 * `ConsultasLogService.registrar()` (fire-and-forget, latencia medida en ms).
 *
 * Auth/autorizacion: `SesionGuard` + `RolesGuard` ya estan registrados como
 * `APP_GUARD` globales. Aqui se exige `@Roles(ADMIN)` a nivel clase: cualquier
 * PARTICIPANTE recibe 403 sin tocar el service.
 */
@Controller("admin/logs")
@Roles(RolUsuario.ADMIN)
export class LogsController {
  constructor(
    private readonly logs: LogsService,
    private readonly consultasLog: ConsultasLogService,
  ) {}

  @Get("cursos")
  async listarCursos(
    @Query(new ZodValidationPipe(listarLogsCursosQuerySchema)) query: ListarLogsCursosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogCambioCursoResumen>> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const resultado = await this.logs.listarCambiosCurso(query)
    const latenciaMs = Date.now() - inicio

    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/cursos",
      queryParams: filtrosCursosMetadata(query),
      latenciaMs,
    })

    return resultado
  }

  @Get("asignaciones")
  async listarAsignaciones(
    @Query(new ZodValidationPipe(listarLogsAsignacionesQuerySchema))
    query: ListarLogsAsignacionesQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<HistoricoEstadoAsignacionResumen>> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const resultado = await this.logs.listarHistoricoAsignacion(query)
    const latenciaMs = Date.now() - inicio

    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/asignaciones",
      queryParams: filtrosAsignacionesMetadata(query),
      latenciaMs,
    })

    return resultado
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion no resuelta en controller protegido por SesionGuard",
      })
    }
    return usuario
  }
}

function filtrosCursosMetadata(query: ListarLogsCursosQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.cursoId) {
    filtros.cursoId = query.cursoId
  }
  if (query.autorUsuarioId) {
    filtros.autorUsuarioId = query.autorUsuarioId
  }
  if (query.accion) {
    filtros.accion = query.accion
  }
  if (query.desde) {
    filtros.desde = query.desde
  }
  if (query.hasta) {
    filtros.hasta = query.hasta
  }
  return filtros
}

function filtrosAsignacionesMetadata(query: ListarLogsAsignacionesQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.asignacionId) {
    filtros.asignacionId = query.asignacionId
  }
  if (query.autorUsuarioId) {
    filtros.autorUsuarioId = query.autorUsuarioId
  }
  if (query.estadoNuevo) {
    filtros.estadoNuevo = query.estadoNuevo
  }
  if (query.desde) {
    filtros.desde = query.desde
  }
  if (query.hasta) {
    filtros.hasta = query.hasta
  }
  return filtros
}
