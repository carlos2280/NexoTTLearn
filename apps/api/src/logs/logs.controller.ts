import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  type ExportarLogsAjustesPlanQuery,
  type ExportarLogsAsignacionesQuery,
  type ExportarLogsConsultasQuery,
  type ExportarLogsCursosQuery,
  type ExportarLogsModulosQuery,
  type ExportarLogsSkillsQuery,
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
  exportarLogsAjustesPlanQuerySchema,
  exportarLogsAsignacionesQuerySchema,
  exportarLogsConsultasQuerySchema,
  exportarLogsCursosQuerySchema,
  exportarLogsModulosQuerySchema,
  exportarLogsSkillsQuerySchema,
  listarLogsAjustesPlanQuerySchema,
  listarLogsAsignacionesQuerySchema,
  listarLogsConsultasQuerySchema,
  listarLogsCursosQuerySchema,
  listarLogsModulosQuerySchema,
  listarLogsSkillsQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, type Prisma, RolUsuario } from "@prisma/client"
import type { Response } from "express"
import { LIMITE_FILAS_EXPORTACION } from "../auditoria/auditoria-export.helpers"
import { AuditLogService } from "../common/audit/audit-log.service"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ExportService } from "../common/export/export.service"
import type { ColumnaDef, ExportResult } from "../common/export/export.types"
import type { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import type { SesionUsuario } from "../common/types/sesion.types"
import { ConsultasLogService } from "../reportes/consultas-log.service"
import {
  COLUMNAS_LOGS_AJUSTES_PLAN,
  COLUMNAS_LOGS_ASIGNACIONES,
  COLUMNAS_LOGS_CONSULTAS,
  COLUMNAS_LOGS_CURSOS,
  COLUMNAS_LOGS_MODULOS,
  COLUMNAS_LOGS_SKILLS,
  type DominioLogs,
  type FilaConsulta,
  type FilaCurso,
  aplanarFilaConsulta,
  aplanarFilaCurso,
  nombreArchivoExport,
} from "./logs-export.helpers"
import { LogsService } from "./logs.service"

/**
 * `LogsController` — Slice futuro B (foundation P-B-a + ampliacion P-B-b + exportadores P-B-c).
 *
 * Visor admin con seis endpoints especificos paginados + seis exportadores
 * CSV/XLSX hermanos:
 *   1. `GET /admin/logs/cursos` (+ `/exportar`)        — `log_cambios_curso`.
 *   2. `GET /admin/logs/asignaciones` (+ `/exportar`)  — `historico_estados_asignacion`.
 *   3. `GET /admin/logs/skills` (+ `/exportar`)        — union `historico_renombrados_skill` +
 *                                                       `historico_cambios_area_skill`.
 *   4. `GET /admin/logs/modulos` (+ `/exportar`)       — `historico_estados_modulo`.
 *   5. `GET /admin/logs/ajustes-plan` (+ `/exportar`)  — `ajustes_plan`.
 *   6. `GET /admin/logs/consultas` (+ `/exportar`)     — `consultas_logs` (meta-auditoria).
 *
 * Reglas heredadas:
 *   - Cada `listar*` exitoso registra una fila en `consultas_logs` via
 *     `ConsultasLogService.registrar()` (fire-and-forget). El visor de
 *     consultas y su exportador NO se autoinscriben para evitar recursion.
 *   - Cada `exportar*` aplica throttle 3/min, valida tope 50k con pre-count,
 *     audita `LOGS_EXPORTADO` (polimorfico por dominio) y registra en
 *     `consultas_logs` (excepto el de consultas).
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
    private readonly auditLog: AuditLogService,
    private readonly exportService: ExportService,
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

  @Get("cursos/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarCursos(
    @Query(new ZodValidationPipe(exportarLogsCursosQuerySchema))
    query: ExportarLogsCursosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const { filas, total } = await this.logs.contarYListarCambiosCursoParaExportar(query)
    this.assertTopeRespetado(total)
    const aplanadas: readonly FilaCurso[] = filas.map(aplanarFilaCurso)
    const result = await this.construirExport("cursos", query.formato, aplanadas, [
      ...COLUMNAS_LOGS_CURSOS,
    ])
    await this.auditarExport("cursos", query, sesion, result, total)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/cursos/exportar",
      queryParams: filtrosCursosExportMetadata(query),
      latenciaMs: Date.now() - inicio,
    })
    this.enviarExport(response, "cursos", result)
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

  @Get("asignaciones/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarAsignaciones(
    @Query(new ZodValidationPipe(exportarLogsAsignacionesQuerySchema))
    query: ExportarLogsAsignacionesQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const { filas, total } = await this.logs.contarYListarHistoricoAsignacionParaExportar(query)
    this.assertTopeRespetado(total)
    const result = await this.construirExport("asignaciones", query.formato, filas, [
      ...COLUMNAS_LOGS_ASIGNACIONES,
    ])
    await this.auditarExport("asignaciones", query, sesion, result, total)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/asignaciones/exportar",
      queryParams: filtrosAsignacionesExportMetadata(query),
      latenciaMs: Date.now() - inicio,
    })
    this.enviarExport(response, "asignaciones", result)
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

  @Get("skills/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarSkills(
    @Query(new ZodValidationPipe(exportarLogsSkillsQuerySchema))
    query: ExportarLogsSkillsQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const { filas, total } = await this.logs.contarYListarEventosSkillParaExportar(query)
    this.assertTopeRespetado(total)
    const result = await this.construirExport("skills", query.formato, filas, [
      ...COLUMNAS_LOGS_SKILLS,
    ])
    await this.auditarExport("skills", query, sesion, result, total)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/skills/exportar",
      queryParams: filtrosSkillsExportMetadata(query),
      latenciaMs: Date.now() - inicio,
    })
    this.enviarExport(response, "skills", result)
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

  @Get("modulos/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarModulos(
    @Query(new ZodValidationPipe(exportarLogsModulosQuerySchema))
    query: ExportarLogsModulosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const { filas, total } = await this.logs.contarYListarEventosModuloParaExportar(query)
    this.assertTopeRespetado(total)
    const result = await this.construirExport("modulos", query.formato, filas, [
      ...COLUMNAS_LOGS_MODULOS,
    ])
    await this.auditarExport("modulos", query, sesion, result, total)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/modulos/exportar",
      queryParams: filtrosModulosExportMetadata(query),
      latenciaMs: Date.now() - inicio,
    })
    this.enviarExport(response, "modulos", result)
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

  @Get("ajustes-plan/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarAjustesPlan(
    @Query(new ZodValidationPipe(exportarLogsAjustesPlanQuerySchema))
    query: ExportarLogsAjustesPlanQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const { filas, total } = await this.logs.contarYListarAjustesPlanParaExportar(query)
    this.assertTopeRespetado(total)
    const result = await this.construirExport("ajustes-plan", query.formato, filas, [
      ...COLUMNAS_LOGS_AJUSTES_PLAN,
    ])
    await this.auditarExport("ajustes-plan", query, sesion, result, total)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/admin/logs/ajustes-plan/exportar",
      queryParams: filtrosAjustesPlanExportMetadata(query),
      latenciaMs: Date.now() - inicio,
    })
    this.enviarExport(response, "ajustes-plan", result)
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

  // Recursion bloqueada: el exportador del visor de consultas tampoco se
  // autoinscribe en `consultas_logs`. La audit `LOGS_EXPORTADO` SI se emite
  // (es el unico rastro forense del export en este visor).
  @Get("consultas/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarConsultas(
    @Query(new ZodValidationPipe(exportarLogsConsultasQuerySchema))
    query: ExportarLogsConsultasQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const { filas, total } = await this.logs.contarYListarConsultasParaExportar(query)
    this.assertTopeRespetado(total)
    const aplanadas: readonly FilaConsulta[] = filas.map(aplanarFilaConsulta)
    const result = await this.construirExport("consultas", query.formato, aplanadas, [
      ...COLUMNAS_LOGS_CONSULTAS,
    ])
    await this.auditarExport("consultas", query, sesion, result, total)
    this.enviarExport(response, "consultas", result)
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

  private assertTopeRespetado(total: number): void {
    if (total > LIMITE_FILAS_EXPORTACION) {
      throw new BadRequestException({
        code: apiErrorCodes.filtroDemasiadoAmplio,
        message:
          "El filtro produce demasiados resultados (>50.000). Reduce el rango temporal o anade filtros adicionales.",
      })
    }
  }

  private async construirExport<T>(
    dominio: DominioLogs,
    formato: "csv" | "xlsx",
    filas: readonly T[],
    columnas: readonly ColumnaDef<T>[],
  ): Promise<ExportResult> {
    return formato === "csv"
      ? await this.exportService.aCsv(filas, columnas)
      : await this.exportService.aXlsx(filas, columnas, `logs-${dominio}`)
  }

  /**
   * Envia el binario al cliente. Se invoca como ultimo paso del handler, una
   * vez que auditoria y meta-auditoria estan commiteadas (orden e2e-friendly:
   * supertest resuelve solo cuando el insert ya esta en la BD).
   */
  private enviarExport(response: Response, dominio: DominioLogs, result: ExportResult): void {
    response.setHeader("Content-Type", result.mime)
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivoExport(dominio, result.extension === "xlsx" ? "xlsx" : "csv")}"`,
    )
    response.send(result.buffer)
  }

  private async auditarExport(
    dominio: DominioLogs,
    query: ExportQueryConFormato,
    sesion: SesionUsuario,
    result: ExportResult,
    totalFilas: number,
  ): Promise<void> {
    const metadata: Prisma.InputJsonObject = {
      dominio,
      formato: result.extension,
      totalFilas,
      filtrosAplicados: filtrosExportMetadata(query),
    }
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.LOGS_EXPORTADO,
      exito: true,
      recursoTipo: "logs",
      metadata,
    })
  }
}

type ExportQueryConFormato =
  | ExportarLogsCursosQuery
  | ExportarLogsAsignacionesQuery
  | ExportarLogsSkillsQuery
  | ExportarLogsModulosQuery
  | ExportarLogsAjustesPlanQuery
  | ExportarLogsConsultasQuery

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

function filtrosCursosExportMetadata(query: ExportarLogsCursosQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = { formato: query.formato }
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

function filtrosAsignacionesExportMetadata(
  query: ExportarLogsAsignacionesQuery,
): Record<string, unknown> {
  const filtros: Record<string, unknown> = { formato: query.formato }
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

function filtrosSkillsExportMetadata(query: ExportarLogsSkillsQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = { formato: query.formato }
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

function filtrosModulosExportMetadata(query: ExportarLogsModulosQuery): Record<string, unknown> {
  const filtros: Record<string, unknown> = { formato: query.formato }
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

function filtrosAjustesPlanExportMetadata(
  query: ExportarLogsAjustesPlanQuery,
): Record<string, unknown> {
  const filtros: Record<string, unknown> = { formato: query.formato }
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

const CLAVES_FILTROS_EXPORT = [
  "cursoId",
  "asignacionId",
  "skillId",
  "moduloId",
  "planId",
  "seccionId",
  "autorUsuarioId",
  "endpoint",
  "estadoNuevo",
  "tipoEvento",
  "accion",
  "desde",
  "hasta",
] as const

function filtrosExportMetadata(query: ExportQueryConFormato): Prisma.InputJsonObject {
  const filtros: Record<string, Prisma.InputJsonValue> = {}
  const queryRecord = query as Record<string, string | undefined>
  for (const clave of CLAVES_FILTROS_EXPORT) {
    const valor = queryRecord[clave]
    if (valor) {
      filtros[clave] = valor
    }
  }
  return filtros
}
