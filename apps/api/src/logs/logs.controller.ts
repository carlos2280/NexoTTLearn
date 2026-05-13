import { Controller, Get, InternalServerErrorException, Query } from "@nestjs/common"
import {
  type HistoricoEstadoAsignacionResumen,
  type ListarLogsAjustesPlanQuery,
  type ListarLogsAsignacionesQuery,
  type ListarLogsConsultasQuery,
  type ListarLogsCursosQuery,
  type ListarLogsModulosQuery,
  type ListarLogsSkillsQuery,
  type LogAjustePlanResumen,
  type LogCambioCursoResumen,
  type LogConsultaResumen,
  type LogModuloEstadoResumen,
  type LogSkillEventoResumen,
  listarLogsAjustesPlanQuerySchema,
  listarLogsAsignacionesQuerySchema,
  listarLogsConsultasQuerySchema,
  listarLogsCursosQuerySchema,
  listarLogsModulosQuerySchema,
  listarLogsSkillsQuerySchema,
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
 * `LogsController` — Slice futuro B (foundation P-B-a + ampliacion P-B-b).
 *
 * Visor admin con seis endpoints especificos:
 *   1. `GET /admin/logs/cursos`        — paginado `log_cambios_curso`.
 *   2. `GET /admin/logs/asignaciones`  — paginado `historico_estados_asignacion`.
 *   3. `GET /admin/logs/skills`        — union `historico_renombrados_skill` +
 *                                        `historico_cambios_area_skill`.
 *   4. `GET /admin/logs/modulos`       — paginado `historico_estados_modulo`.
 *   5. `GET /admin/logs/ajustes-plan`  — paginado `ajustes_plan`.
 *   6. `GET /admin/logs/consultas`     — paginado `consultas_logs` (meta-auditoria).
 *
 * Cada consulta exitosa registra una fila en `consultas_logs` via
 * `ConsultasLogService.registrar()` (fire-and-forget, latencia medida en ms)
 * SALVO el endpoint `consultas`: registrarse a si mismo crearia un loop
 * recursivo de inserts.
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

  @Get("skills")
  async listarSkills(
    @Query(new ZodValidationPipe(listarLogsSkillsQuerySchema)) query: ListarLogsSkillsQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogSkillEventoResumen>> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const resultado = await this.logs.listarEventosSkill(query)
    const latenciaMs = Date.now() - inicio

    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/skills",
      queryParams: filtrosSkillsMetadata(query),
      latenciaMs,
    })

    return resultado
  }

  @Get("modulos")
  async listarModulos(
    @Query(new ZodValidationPipe(listarLogsModulosQuerySchema)) query: ListarLogsModulosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogModuloEstadoResumen>> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const resultado = await this.logs.listarEventosModulo(query)
    const latenciaMs = Date.now() - inicio

    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/modulos",
      queryParams: filtrosModulosMetadata(query),
      latenciaMs,
    })

    return resultado
  }

  @Get("ajustes-plan")
  async listarAjustesPlan(
    @Query(new ZodValidationPipe(listarLogsAjustesPlanQuerySchema))
    query: ListarLogsAjustesPlanQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogAjustePlanResumen>> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const resultado = await this.logs.listarAjustesPlan(query)
    const latenciaMs = Date.now() - inicio

    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/ajustes-plan",
      queryParams: filtrosAjustesPlanMetadata(query),
      latenciaMs,
    })

    return resultado
  }

  // Recursion bloqueada: no se registra en `consultas_logs` para evitar un
  // loop infinito de inserts cada vez que se consulta el visor de consultas.
  @Get("consultas")
  async listarConsultas(
    @Query(new ZodValidationPipe(listarLogsConsultasQuerySchema))
    query: ListarLogsConsultasQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogConsultaResumen>> {
    this.requireUsuario(usuario)
    return await this.logs.listarConsultas(query)
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

function filtrosSkillsMetadata(query: ListarLogsSkillsQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.skillId) {
    filtros.skillId = query.skillId
  }
  if (query.tipoEvento) {
    filtros.tipoEvento = query.tipoEvento
  }
  if (query.autorUsuarioId) {
    filtros.autorUsuarioId = query.autorUsuarioId
  }
  if (query.desde) {
    filtros.desde = query.desde
  }
  if (query.hasta) {
    filtros.hasta = query.hasta
  }
  return filtros
}

function filtrosModulosMetadata(query: ListarLogsModulosQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.moduloId) {
    filtros.moduloId = query.moduloId
  }
  if (query.estadoNuevo) {
    filtros.estadoNuevo = query.estadoNuevo
  }
  if (query.autorUsuarioId) {
    filtros.autorUsuarioId = query.autorUsuarioId
  }
  if (query.desde) {
    filtros.desde = query.desde
  }
  if (query.hasta) {
    filtros.hasta = query.hasta
  }
  return filtros
}

function filtrosAjustesPlanMetadata(query: ListarLogsAjustesPlanQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = {
    page: query.page,
    pageSize: query.pageSize,
  }
  if (query.planId) {
    filtros.planId = query.planId
  }
  if (query.seccionId) {
    filtros.seccionId = query.seccionId
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
