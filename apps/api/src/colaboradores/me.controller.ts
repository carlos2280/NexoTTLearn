import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Query,
  Res,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import type {
  CursoArbolResponse,
  ExportarFichaQuery,
  FichaResponse,
  FichaResumenResponse,
  MeAvanceCursoResponse,
  MeBandejaResponse,
  MeCursoResumen,
  MeCursosQuery,
  ResumenCierreCurso,
} from "@nexott-learn/shared-types"
import { exportarFichaQuerySchema, meCursosQuerySchema } from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import type { Response } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { FichaService } from "./ficha/ficha.service"
import { MeAvanceService } from "./me-avance.service"
import { MeBandejaService } from "./me-bandeja.service"
import { MeCursoArbolService } from "./me-curso-arbol.service"
import { MeCursosService } from "./me-cursos.service"
import { fichaACsv, fichaAPdf } from "./me-ficha-export.helpers"
import { MeFichaResumenService } from "./me-ficha-resumen.service"
import { MeResumenCierreService } from "./me-resumen-cierre.service"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Endpoints autoservicio bajo `/me`.
 *
 *  P5a       — `/me/ficha`
 *  P11c      — `/me/avance/cursos/:cursoId` (D-S11-C8, cap. 10.7).
 *  FIX-pre-S12 — `/me/cursos` y `/me/ficha/exportar`.
 *
 * La identidad SIEMPRE viene de la sesion (`@CurrentUser`), jamas del path,
 * body o query. ADMIN puede usar los endpoints de lectura si su usuario tiene
 * colaborador asociado (uso operativo cruzado). Para `/me/ficha/exportar` el
 * acceso es solo PARTICIPANTE: el derecho de portabilidad RGPD es del titular.
 */
@Controller("me")
export class MeController {
  constructor(
    private readonly fichaService: FichaService,
    private readonly meAvanceService: MeAvanceService,
    private readonly meBandejaService: MeBandejaService,
    private readonly meCursoArbolService: MeCursoArbolService,
    private readonly meCursosService: MeCursosService,
    private readonly meFichaResumenService: MeFichaResumenService,
    private readonly meResumenCierreService: MeResumenCierreService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get("bandeja")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  obtenerMiBandeja(@CurrentUser() usuario: SesionUsuario | undefined): Promise<MeBandejaResponse> {
    const sesion = this.requireUsuario(usuario)
    return this.meBandejaService.obtenerBandeja(sesion.usuarioId)
  }

  @Get("ficha")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  async obtenerMiFicha(@CurrentUser() usuario: SesionUsuario | undefined): Promise<FichaResponse> {
    const sesion = this.requireUsuario(usuario)
    return await this.fichaService.obtenerFichaDeUsuario(sesion.usuarioId, sesion)
  }

  @Get("ficha/resumen")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  obtenerMiFichaResumen(
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<FichaResumenResponse> {
    const sesion = this.requireUsuario(usuario)
    return this.meFichaResumenService.obtenerResumen(sesion.usuarioId)
  }

  @Get("cursos")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  obtenerMisCursos(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Query(new ZodValidationPipe(meCursosQuerySchema)) query: MeCursosQuery,
  ): Promise<Paginated<MeCursoResumen>> {
    const sesion = this.requireUsuario(usuario)
    return this.meCursosService.listarMisCursos(sesion.usuarioId, query)
  }

  @Get("ficha/exportar")
  @Roles(RolUsuario.PARTICIPANTE)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportarMiFicha(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Query(new ZodValidationPipe(exportarFichaQuerySchema)) query: ExportarFichaQuery,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const ficha = await this.fichaService.obtenerFichaDeUsuario(sesion.usuarioId, sesion)
    const fechaArchivo = new Date().toISOString().slice(0, 10)
    const baseFilename = `ficha-${ficha.colaboradorId}-${fechaArchivo}`

    if (query.formato === "csv") {
      const csv = fichaACsv(ficha)
      response.setHeader("Content-Type", "text/csv; charset=utf-8")
      response.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.csv"`)
      response.end(Buffer.from(csv, "utf-8"))
    } else {
      const pdf = await fichaAPdf(ficha)
      response.setHeader("Content-Type", "application/pdf")
      response.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.pdf"`)
      response.end(pdf)
    }

    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.FICHA_EXPORTADA,
      exito: true,
      recursoTipo: "ficha",
      recursoId: ficha.colaboradorId,
      metadata: {
        formato: query.formato,
      },
    })
  }

  @Get("avance/cursos/:cursoId")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  obtenerMiAvanceCurso(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Param("cursoId") cursoId: string,
  ): Promise<MeAvanceCursoResponse> {
    const sesion = this.requireUsuario(usuario)
    if (!UUID_REGEX.test(cursoId)) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidQuery,
        message: "cursoId no es un UUID valido.",
      })
    }
    return this.meAvanceService.obtenerAvanceDeUsuario(sesion.usuarioId, cursoId)
  }

  /**
   * `GET /me/cursos/:cursoId/arbol` (Capa 2 catalogo) — arbol unificado del
   * curso para el participante. Devuelve `modo` (asignado | voluntario |
   * preview), `asignacionId` (null en preview), cabecera del curso y modulos
   * + secciones. Sin bloques (los bloques se piden al abrir cada seccion).
   *
   * Reglas de visibilidad: ver `MeCursoArbolService`.
   */
  @Get("cursos/:cursoId/arbol")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  obtenerArbolCurso(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Param("cursoId") cursoId: string,
  ): Promise<CursoArbolResponse> {
    const sesion = this.requireUsuario(usuario)
    if (!UUID_REGEX.test(cursoId)) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidQuery,
        message: "cursoId no es un UUID valido.",
      })
    }
    return this.meCursoArbolService.obtenerArbol(sesion.usuarioId, cursoId)
  }

  /**
   * `GET /me/cursos/:cursoId/resumen-cierre` (B-26). Veredicto del curso para
   * la pantalla `/cursos/:cursoId/cerrado`. Devuelve 409 `cursoNoCerrado` si
   * el curso todavia no esta cerrado o si la fotografia no esta disponible.
   */
  @Get("cursos/:cursoId/resumen-cierre")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  obtenerResumenCierreCurso(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Param("cursoId") cursoId: string,
  ): Promise<ResumenCierreCurso> {
    const sesion = this.requireUsuario(usuario)
    if (!UUID_REGEX.test(cursoId)) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidQuery,
        message: "cursoId no es un UUID valido.",
      })
    }
    return this.meResumenCierreService.obtenerResumenCierreDeUsuario(sesion.usuarioId, cursoId)
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return usuario
  }
}
