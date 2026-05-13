import { Readable } from "node:stream"
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { Throttle } from "@nestjs/throttler"
import {
  AplicarRequest,
  AplicarResponse,
  CargaEvaluacionInicialResumen,
  PaginacionQuery,
  Paginated,
  PreviewResponse,
  aplicarRequestSchema,
  paginacionQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { memoryStorage } from "multer"
import { z } from "zod"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { AplicarService } from "./aplicar.service"
import { ExcelTemplateService } from "./excel-template.service"
import { HistorialService } from "./historial.service"
import { PreviewService } from "./preview.service"

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const HORA_MS = 60 * 60 * 1000
const idempotencyKeyUuidSchema = z.string().uuid()

@Controller("cursos/:cursoId/evaluacion-inicial")
export class EvaluacionInicialController {
  constructor(
    private readonly templateService: ExcelTemplateService,
    private readonly previewService: PreviewService,
    private readonly aplicarService: AplicarService,
    private readonly historialService: HistorialService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * D7 — Descarga del template Excel del curso (ADMIN). Genera el workbook con
   * la fila por asignado activo y columnas codificadas para el parser inverso.
   * Audita `EVALUACION_TEMPLATE_DESCARGADO` con metadata estructural.
   */
  @Get("template")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async descargarTemplate(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const sesion = this.requireUsuario(usuario)
    const resultado = await this.templateService.generarTemplate(cursoId)
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.EVALUACION_TEMPLATE_DESCARGADO,
      exito: true,
      recursoTipo: "curso",
      recursoId: cursoId,
      metadata: {
        skillsExigidas: resultado.skillsExigidas,
        areasExigidas: resultado.areasExigidas,
        asignados: resultado.asignados,
      },
      ...extractContextoHttp(req),
    })
    return new StreamableFile(Readable.from(resultado.buffer), {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      disposition: `attachment; filename="eval-inicial-${cursoId}.xlsx"`,
    })
  }

  /**
   * D-EVI-2/6/8 — Subir el Excel, validar celda a celda, construir preview
   * transitorio (TTL 30 min). Multer 2.x con memoryStorage (cierre §5.8): el
   * buffer pasa al StorageService desde el controller para no tocar tmp.
   *
   * Rate-limit: 10 requests por hora por usuario (Throttle override del default
   * `long`). Mantenemos el `short` para evitar floods burst en menos de un
   * minuto.
   */
  @Post("preview")
  @Roles(RolUsuario.ADMIN)
  @Throttle({
    short: { ttl: 60_000, limit: 5 },
    long: { ttl: HORA_MS, limit: 10 },
  })
  @UseInterceptors(
    FileInterceptor("archivo", {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
        fields: 10,
        fieldSize: 1024,
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async crearPreview(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    // biome-ignore lint/correctness/noUndeclaredVariables: `Express.Multer.File` es un tipo global aportado por `@types/multer` (declara `namespace Express.Multer { interface File }`). Biome no resuelve namespaces globales declarados via `.d.ts`.
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<PreviewResponse> {
    const sesion = this.requireUsuario(usuario)
    if (!archivo) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: "Falta el archivo 'archivo' en el multipart.",
      })
    }
    const response = await this.previewService.crearPreview({
      cursoId,
      buffer: archivo.buffer,
      mimeType: archivo.mimetype,
      tamanioBytes: archivo.size,
      nombreOriginal: archivo.originalname ?? "archivo.xlsx",
      sesion,
    })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.EVALUACION_PREVIEW_CREADO,
      exito: true,
      recursoTipo: "curso",
      recursoId: cursoId,
      metadata: {
        previewId: response.previewId,
        archivoId: response.archivoId,
        filasTotales: response.resumen.filasTotales,
        filasValidas: response.resumen.filasValidas,
        filasRechazadas: response.resumen.filasRechazadas,
        skillsAfectadas: response.resumen.skillsAfectadas,
        colaboradoresAfectados: response.resumen.colaboradoresAfectados,
      },
      ...extractContextoHttp(req),
    })
    return response
  }

  /**
   * D-EVI-2 — Descartar un preview no aplicado. Race-safe: el `deleteMany`
   * con guard `aplicadoEn IS NULL` previene que dos admins concurrentes
   * descarten y apliquen a la vez. El `Archivo` no se borra del storage:
   * queda como evidencia (D-EVI-1 retencion 5 anios).
   */
  @Delete(":previewId")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async descartarPreview(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Param("previewId", ParseUUIDPipe) previewId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const { archivoId } = await this.previewService.descartarPreview(cursoId, previewId)
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.EVALUACION_PREVIEW_DESCARTADO,
      exito: true,
      recursoTipo: "curso",
      recursoId: cursoId,
      metadata: { previewId, archivoId },
      ...extractContextoHttp(req),
    })
  }

  /**
   * D-EVI-3 + D-EVI-7 — Aplicar preview idempotente con `Idempotency-Key`.
   * Toda la mutacion vive en un `$transaction` (`AplicarService.aplicar`).
   * El audit log se escribe SOLO en el primer aplicar (no en replay).
   *
   * Rate-limit `5/min` por usuario (operacion cara; defensa en profundidad).
   */
  @Post(":previewId/aplicar")
  @Roles(RolUsuario.ADMIN)
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async aplicar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Param("previewId", ParseUUIDPipe) previewId: string,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(aplicarRequestSchema)) body: AplicarRequest,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AplicarResponse> {
    const sesion = this.requireUsuario(usuario)
    const keyValida =
      idempotencyKey !== undefined && idempotencyKeyUuidSchema.safeParse(idempotencyKey).success
    if (!keyValida) {
      throw new BadRequestException({
        code: apiErrorCodes.idempotencyKeyRequerida,
        message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
      })
    }

    const ejecucion = await this.aplicarService.aplicar({
      cursoId,
      previewId,
      idempotencyKey,
      usuarioId: sesion.usuarioId,
      body,
    })

    if (!ejecucion.replay) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.EVALUACION_APLICADA,
        exito: true,
        recursoTipo: "curso",
        recursoId: cursoId,
        metadata: {
          previewId,
          cargaId: ejecucion.body.cargaId,
          skillsActualizadas: ejecucion.body.skillsActualizadas,
          colaboradoresActualizados: ejecucion.body.colaboradoresActualizados,
          planesMarcadosDesactualizados: ejecucion.body.planesMarcadosDesactualizados,
        },
        ...extractContextoHttp(req),
      })
    }

    // (S11.5b cerrado) EXCEL_CARGADO + PLANES_DESACTUALIZADOS se emiten
    // desde aplicar.service.ts:105 y :107 tras runOnce exitoso con
    // guard `!ejecucion.replay`. Identidad desde input.usuarioId (A01).

    return ejecucion.body
  }

  /**
   * Lista paginada (Paginated<T>) de cargas aplicadas anteriores del curso.
   * Lecturas NO se auditan (decision del contrato HTTP).
   */
  @Get("historial")
  @Roles(RolUsuario.ADMIN)
  historial(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Query(new ZodValidationPipe(paginacionQuerySchema)) query: PaginacionQuery,
  ): Promise<Paginated<CargaEvaluacionInicialResumen>> {
    return this.historialService.listar(cursoId, query)
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
