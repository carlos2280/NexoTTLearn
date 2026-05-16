import { Controller, Get, InternalServerErrorException, Query, Res } from "@nestjs/common"
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
import { RolUsuario } from "@prisma/client"
import type { Response } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ExportService } from "../common/export/export.service"
import type { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import type { SesionUsuario } from "../common/types/sesion.types"
import { ConsultasLogService } from "../reportes/consultas-log.service"
import {
  type DependenciasListadoExportable,
  ejecutarExportarLogs,
  ejecutarListarLogs,
} from "./listado-exportable.helper"
import {
  COLUMNAS_LOGS_AJUSTES_PLAN,
  COLUMNAS_LOGS_ASIGNACIONES,
  COLUMNAS_LOGS_CONSULTAS,
  COLUMNAS_LOGS_CURSOS,
  COLUMNAS_LOGS_MODULOS,
  COLUMNAS_LOGS_SKILLS,
  aplanarFilaConsulta,
  aplanarFilaCurso,
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
 * La logica comun de los seis pares vive en `ejecutarListarLogs` y
 * `ejecutarExportarLogs` (`./listado-exportable.helper`). Aqui solo
 * permanece el cableo Nest (decoradores, validacion Zod, rutas).
 *
 * Auth/autorizacion: `SesionGuard` + `RolesGuard` ya estan registrados como
 * `APP_GUARD` globales. Aqui se exige `@Roles(ADMIN)` a nivel clase: cualquier
 * PARTICIPANTE recibe 403 sin tocar el service.
 */
@Controller("admin/logs")
@Roles(RolUsuario.ADMIN)
export class LogsController {
  private readonly deps: DependenciasListadoExportable

  constructor(
    private readonly logs: LogsService,
    consultasLog: ConsultasLogService,
    auditLog: AuditLogService,
    exportService: ExportService,
  ) {
    this.deps = { consultasLog, auditLog, exportService }
  }

  @Get("cursos")
  async listarCursos(
    @Query(new ZodValidationPipe(listarLogsCursosQuerySchema)) query: ListarLogsCursosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogCambioCursoResumen>> {
    return ejecutarListarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      endpoint: "/admin/logs/cursos",
      fetch: (q) => this.logs.listarCambiosCurso(q),
      registrarEnConsultas: true,
    })
  }

  @Get("cursos/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarCursos(
    @Query(new ZodValidationPipe(exportarLogsCursosQuerySchema))
    query: ExportarLogsCursosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await ejecutarExportarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      response,
      dominio: "cursos",
      endpoint: "/admin/logs/cursos/exportar",
      columnas: COLUMNAS_LOGS_CURSOS,
      fetch: (q) => this.logs.contarYListarCambiosCursoParaExportar(q),
      mapper: aplanarFilaCurso,
      registrarEnConsultas: true,
    })
  }

  @Get("asignaciones")
  async listarAsignaciones(
    @Query(new ZodValidationPipe(listarLogsAsignacionesQuerySchema))
    query: ListarLogsAsignacionesQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<HistoricoEstadoAsignacionResumen>> {
    return ejecutarListarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      endpoint: "/admin/logs/asignaciones",
      fetch: (q) => this.logs.listarHistoricoAsignacion(q),
      registrarEnConsultas: true,
    })
  }

  @Get("asignaciones/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarAsignaciones(
    @Query(new ZodValidationPipe(exportarLogsAsignacionesQuerySchema))
    query: ExportarLogsAsignacionesQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await ejecutarExportarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      response,
      dominio: "asignaciones",
      endpoint: "/admin/logs/asignaciones/exportar",
      columnas: COLUMNAS_LOGS_ASIGNACIONES,
      fetch: (q) => this.logs.contarYListarHistoricoAsignacionParaExportar(q),
      registrarEnConsultas: true,
    })
  }

  @Get("skills")
  async listarSkills(
    @Query(new ZodValidationPipe(listarLogsSkillsQuerySchema)) query: ListarLogsSkillsQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogSkillEventoResumen>> {
    return ejecutarListarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      endpoint: "/admin/logs/skills",
      fetch: (q) => this.logs.listarEventosSkill(q),
      registrarEnConsultas: true,
    })
  }

  @Get("skills/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarSkills(
    @Query(new ZodValidationPipe(exportarLogsSkillsQuerySchema))
    query: ExportarLogsSkillsQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await ejecutarExportarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      response,
      dominio: "skills",
      endpoint: "/admin/logs/skills/exportar",
      columnas: COLUMNAS_LOGS_SKILLS,
      fetch: (q) => this.logs.contarYListarEventosSkillParaExportar(q),
      registrarEnConsultas: true,
    })
  }

  @Get("modulos")
  async listarModulos(
    @Query(new ZodValidationPipe(listarLogsModulosQuerySchema)) query: ListarLogsModulosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogModuloEstadoResumen>> {
    return ejecutarListarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      endpoint: "/admin/logs/modulos",
      fetch: (q) => this.logs.listarEventosModulo(q),
      registrarEnConsultas: true,
    })
  }

  @Get("modulos/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarModulos(
    @Query(new ZodValidationPipe(exportarLogsModulosQuerySchema))
    query: ExportarLogsModulosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await ejecutarExportarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      response,
      dominio: "modulos",
      endpoint: "/admin/logs/modulos/exportar",
      columnas: COLUMNAS_LOGS_MODULOS,
      fetch: (q) => this.logs.contarYListarEventosModuloParaExportar(q),
      registrarEnConsultas: true,
    })
  }

  @Get("ajustes-plan")
  async listarAjustesPlan(
    @Query(new ZodValidationPipe(listarLogsAjustesPlanQuerySchema))
    query: ListarLogsAjustesPlanQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogAjustePlanResumen>> {
    return ejecutarListarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      endpoint: "/admin/logs/ajustes-plan",
      fetch: (q) => this.logs.listarAjustesPlan(q),
      registrarEnConsultas: true,
    })
  }

  @Get("ajustes-plan/exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarAjustesPlan(
    @Query(new ZodValidationPipe(exportarLogsAjustesPlanQuerySchema))
    query: ExportarLogsAjustesPlanQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await ejecutarExportarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      response,
      dominio: "ajustes-plan",
      endpoint: "/admin/logs/ajustes-plan/exportar",
      columnas: COLUMNAS_LOGS_AJUSTES_PLAN,
      fetch: (q) => this.logs.contarYListarAjustesPlanParaExportar(q),
      registrarEnConsultas: true,
    })
  }

  // Recursion bloqueada: no se registra en `consultas_logs` para evitar un
  // loop infinito de inserts cada vez que se consulta el visor de consultas.
  @Get("consultas")
  async listarConsultas(
    @Query(new ZodValidationPipe(listarLogsConsultasQuerySchema))
    query: ListarLogsConsultasQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<LogConsultaResumen>> {
    return ejecutarListarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      endpoint: "/admin/logs/consultas",
      fetch: (q) => this.logs.listarConsultas(q),
      registrarEnConsultas: false,
    })
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
    await ejecutarExportarLogs(this.deps, {
      query,
      sesion: this.requireUsuario(usuario),
      response,
      dominio: "consultas",
      endpoint: "/admin/logs/consultas/exportar",
      columnas: COLUMNAS_LOGS_CONSULTAS,
      fetch: (q) => this.logs.contarYListarConsultasParaExportar(q),
      mapper: aplanarFilaConsulta,
      registrarEnConsultas: false,
    })
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
