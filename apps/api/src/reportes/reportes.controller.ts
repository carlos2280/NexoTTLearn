import {
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
  UnprocessableEntityException,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  type AvanceCursoQuery,
  type BrechasDetectadasQuery,
  type BrechasDetectadasResponse,
  type CentroRevisionQuery,
  type CentroRevisionResponse,
  type DetalleColaboradorQuery,
  type DetalleColaboradorResponse,
  type EficaciaPlataformaQuery,
  type EficaciaPlataformaResponse,
  type EventoHistorico,
  type FilaAvanceCurso,
  type HistoricoClienteQuery,
  type HistoricoClienteResponse,
  type InventarioSkillsQuery,
  type InventarioSkillsResponse,
  type ReutilizacionCatalogoQuery,
  type ReutilizacionCatalogoResponse,
  avanceCursoQuerySchema,
  brechasDetectadasQuerySchema,
  centroRevisionQuerySchema,
  detalleColaboradorQuerySchema,
  eficaciaPlataformaQuerySchema,
  historicoClienteQuerySchema,
  inventarioSkillsQuerySchema,
  reutilizacionCatalogoQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import type { Response } from "express"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ExportService } from "../common/export/export.service"
import type { ColumnaDef, ExportResult } from "../common/export/export.types"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { ConsultasLogService } from "./consultas-log.service"
import { ReportesService } from "./reportes.service"

/**
 * Controller del modulo reportes — operativos (P11b) + estrategicos (P11c).
 *
 * Auth/autorizacion: SesionGuard + RolesGuard estan registrados como
 * APP_GUARD globales en `app.module.ts`. Aqui solo se exige el rol con
 * `@Roles(ADMIN)` a nivel clase (D-S11-B10). PARTICIPANTE -> 403 limpio.
 *
 * Throttle a nivel clase 30/min heredando convencion P10b estrategicos.
 *
 * Operativos (P11b — E1-E4): solo format=json. ConsultasLog NO se invoca.
 * Estrategicos (P11c — E5-E8): format json/csv/xlsx/pdf via ExportService.
 *   Audit `consultas_logs` post-exito por hit (D-S11-C4).
 */
@Controller("reportes")
@Roles(RolUsuario.ADMIN)
@Throttle({ default: { ttl: 60_000, limit: 30 } })
export class ReportesController {
  constructor(
    private readonly reportes: ReportesService,
    private readonly exportService: ExportService,
    private readonly consultasLog: ConsultasLogService,
  ) {}

  // ---------------------------------------------------------------------------
  // P11b — operativos (sin export, sin audit)
  // ---------------------------------------------------------------------------

  @Get("avance-curso")
  obtenerAvanceCurso(
    @Query(new ZodValidationPipe(avanceCursoQuerySchema)) query: AvanceCursoQuery,
  ): Promise<Paginated<FilaAvanceCurso> | Paginated<EventoHistorico>> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerAvanceCurso(query)
  }

  @Get("detalle-colaborador")
  obtenerDetalleColaborador(
    @Query(new ZodValidationPipe(detalleColaboradorQuerySchema))
    query: DetalleColaboradorQuery,
  ): Promise<DetalleColaboradorResponse> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerDetalleColaborador(query)
  }

  @Get("brechas-detectadas")
  obtenerBrechasDetectadas(
    @Query(new ZodValidationPipe(brechasDetectadasQuerySchema))
    query: BrechasDetectadasQuery,
  ): Promise<BrechasDetectadasResponse> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerBrechasDetectadas(query)
  }

  @Get("centro-revision")
  obtenerCentroRevision(
    @Query(new ZodValidationPipe(centroRevisionQuerySchema))
    query: CentroRevisionQuery,
  ): Promise<CentroRevisionResponse> {
    this.exigirFormatoJson(query.format)
    return this.reportes.obtenerCentroRevision(query)
  }

  // ---------------------------------------------------------------------------
  // P11c — estrategicos (cache + export + audit consultas_logs)
  // ---------------------------------------------------------------------------

  @Get("eficacia-plataforma")
  async obtenerEficaciaPlataforma(
    @Query(new ZodValidationPipe(eficaciaPlataformaQuerySchema))
    query: EficaciaPlataformaQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<EficaciaPlataformaResponse | undefined> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const payload = await this.reportes.eficaciaPlataforma(query)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/reportes/eficacia-plataforma",
      queryParams: this.queryAJson(query),
      latenciaMs: Date.now() - inicio,
    })
    if (query.format === "json") {
      return payload
    }
    const result = await this.exportarEficacia(payload, query.format)
    this.aplicarHeadersExport(response, result, "eficacia-plataforma")
    response.end(result.buffer)
    return undefined
  }

  @Get("historico-cliente")
  async obtenerHistoricoCliente(
    @Query(new ZodValidationPipe(historicoClienteQuerySchema))
    query: HistoricoClienteQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<HistoricoClienteResponse | undefined> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const payload = await this.reportes.historicoCliente(query)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/reportes/historico-cliente",
      queryParams: this.queryAJson(query),
      latenciaMs: Date.now() - inicio,
    })
    if (query.format === "json") {
      return payload
    }
    const result = await this.exportarHistorico(payload, query.format)
    this.aplicarHeadersExport(response, result, "historico-cliente")
    response.end(result.buffer)
    return undefined
  }

  @Get("inventario-skills")
  async obtenerInventarioSkills(
    @Query(new ZodValidationPipe(inventarioSkillsQuerySchema))
    query: InventarioSkillsQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<InventarioSkillsResponse | undefined> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const payload = await this.reportes.inventarioSkills(query)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/reportes/inventario-skills",
      queryParams: this.queryAJson(query),
      latenciaMs: Date.now() - inicio,
    })
    if (query.format === "json") {
      return payload
    }
    const result = await this.exportarInventario(payload, query.format)
    this.aplicarHeadersExport(response, result, "inventario-skills")
    response.end(result.buffer)
    return undefined
  }

  @Get("reutilizacion-catalogo")
  async obtenerReutilizacionCatalogo(
    @Query(new ZodValidationPipe(reutilizacionCatalogoQuerySchema))
    query: ReutilizacionCatalogoQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ReutilizacionCatalogoResponse | undefined> {
    const sesion = this.requireUsuario(usuario)
    const inicio = Date.now()
    const payload = await this.reportes.reutilizacionCatalogo(query)
    await this.consultasLog.registrar({
      autorUsuarioId: sesion.usuarioId,
      endpoint: "/reportes/reutilizacion-catalogo",
      queryParams: this.queryAJson(query),
      latenciaMs: Date.now() - inicio,
    })
    if (query.format === "json") {
      return payload
    }
    const result = await this.exportarReutilizacion(payload, query.format)
    this.aplicarHeadersExport(response, result, "reutilizacion-catalogo")
    response.end(result.buffer)
    return undefined
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return usuario
  }

  private exigirFormatoJson(formato: string): void {
    if (formato !== "json") {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.formatoNoSoportadoEnP11b,
        message:
          "Solo se admite format=json en operativos. CSV/XLSX/PDF disponible en estrategicos.",
      })
    }
  }

  private queryAJson(query: object): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(query)) {
      if (v instanceof Date) {
        result[k] = v.toISOString()
      } else if (Array.isArray(v)) {
        result[k] = [...v]
      } else {
        result[k] = v
      }
    }
    return result
  }

  private aplicarHeadersExport(response: Response, result: ExportResult, base: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    response.setHeader("Content-Type", result.mime)
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${base}-${timestamp}.${result.extension}"`,
    )
  }

  private exportarEficacia(
    payload: EficaciaPlataformaResponse,
    formato: "csv" | "xlsx" | "pdf",
  ): Promise<ExportResult> {
    const rows = [
      // biome-ignore lint/nursery/noSecrets: nombre de metrica de dominio, no secreto.
      { nombre: "presentadosCliente", valor: payload.presentadosCliente },
      { nombre: "aptos.total", valor: payload.aptos.total },
      { nombre: "aptos.pasaron", valor: payload.aptos.pasaron },
      { nombre: "aptos.noPasaron", valor: payload.aptos.noPasaron },
      { nombre: "aptos.pendientes", valor: payload.aptos.pendientes },
      { nombre: "noAptos.total", valor: payload.noAptos.total },
      { nombre: "noAptos.presentadosIgual", valor: payload.noAptos.presentadosIgual },
      { nombre: "noAptos.pasaronIgual", valor: payload.noAptos.pasaronIgual },
      { nombre: "correlacion", valor: payload.correlacion ?? 0 },
    ]
    const columnas: ColumnaDef<(typeof rows)[number]>[] = [
      { key: "nombre", header: "Metrica" },
      { key: "valor", header: "Valor", formato: "numero" },
    ]
    return this.exportarPorFormato("Eficacia plataforma", rows, columnas, formato)
  }

  private exportarHistorico(
    payload: HistoricoClienteResponse,
    formato: "csv" | "xlsx" | "pdf",
  ): Promise<ExportResult> {
    const rows = payload.cursos.map((c) => ({
      cursoId: c.cursoId,
      titulo: c.titulo,
      presentados: c.presentados,
      aceptados: c.aceptados,
      porcentajeAceptacion: c.porcentajeAceptacion,
    }))
    const columnas: ColumnaDef<(typeof rows)[number]>[] = [
      { key: "cursoId", header: "Curso ID" },
      { key: "titulo", header: "Titulo" },
      { key: "presentados", header: "Presentados", formato: "numero" },
      { key: "aceptados", header: "Aceptados", formato: "numero" },
      // biome-ignore lint/nursery/noSecrets: nombre de metrica de dominio, no secreto.
      { key: "porcentajeAceptacion", header: "% Aceptacion", formato: "porcentaje" },
    ]
    return this.exportarPorFormato(
      `Historico cliente ${payload.clienteId}`,
      rows,
      columnas,
      formato,
    )
  }

  private exportarInventario(
    payload: InventarioSkillsResponse,
    formato: "csv" | "xlsx" | "pdf",
  ): Promise<ExportResult> {
    const rows = payload.skills.map((s) => ({
      skillId: s.skillId,
      etiqueta: s.etiqueta,
      total: s.totalColaboradores,
      excelencia: s.porEtiquetaCualitativa.excelencia,
      solido: s.porEtiquetaCualitativa.solido,
      enDesarrollo: s.porEtiquetaCualitativa.enDesarrollo,
      noCumple: s.porEtiquetaCualitativa.noCumple,
    }))
    const columnas: ColumnaDef<(typeof rows)[number]>[] = [
      { key: "skillId", header: "Skill ID" },
      { key: "etiqueta", header: "Etiqueta" },
      { key: "total", header: "Total", formato: "numero" },
      { key: "excelencia", header: "Excelencia", formato: "numero" },
      { key: "solido", header: "Solido", formato: "numero" },
      { key: "enDesarrollo", header: "En desarrollo", formato: "numero" },
      { key: "noCumple", header: "No cumple", formato: "numero" },
    ]
    return this.exportarPorFormato("Inventario skills", rows, columnas, formato)
  }

  private exportarReutilizacion(
    payload: ReutilizacionCatalogoResponse,
    formato: "csv" | "xlsx" | "pdf",
  ): Promise<ExportResult> {
    const rows = [
      ...payload.modulos.map((m) => ({
        tipo: "MODULO",
        id: m.moduloId,
        nombre: m.titulo,
        veces: m.vecesUsado,
        cursosUnicos: m.cursosUnicos,
      })),
      ...payload.skills.map((s) => ({
        tipo: "SKILL",
        id: s.skillId,
        nombre: s.etiqueta,
        veces: s.vecesExigida,
        cursosUnicos: s.cursosUnicos,
      })),
    ]
    const columnas: ColumnaDef<(typeof rows)[number]>[] = [
      { key: "tipo", header: "Tipo" },
      { key: "id", header: "ID" },
      { key: "nombre", header: "Nombre" },
      { key: "veces", header: "Veces usado/exigida", formato: "numero" },
      { key: "cursosUnicos", header: "Cursos unicos", formato: "numero" },
    ]
    return this.exportarPorFormato("Reutilizacion catalogo", rows, columnas, formato)
  }

  private exportarPorFormato<T>(
    titulo: string,
    rows: readonly T[],
    columnas: readonly ColumnaDef<T>[],
    formato: "csv" | "xlsx" | "pdf",
  ): Promise<ExportResult> {
    switch (formato) {
      case "csv":
        return this.exportService.aCsv(rows, columnas)
      case "xlsx":
        return this.exportService.aXlsx(rows, columnas, titulo)
      case "pdf":
        return this.exportService.aPdf(titulo, columnas, rows)
      default:
        return this.exportService.aCsv(rows, columnas)
    }
  }
}
