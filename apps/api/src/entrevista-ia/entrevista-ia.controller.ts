import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnprocessableEntityException,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  AjustarEntrevistaBodyInput,
  AjustarEntrevistaResponse,
  AnularEntrevistaBodyInput,
  AnularEntrevistaResponse,
  CrearIntentoEntrevistaIaResponse,
  DisponibilidadEntrevistaIaResponse,
  EntrevistaIaResponse,
  EnviarTurnoInput,
  EnviarTurnoResponse,
  FinalizarEntrevistaBodyInput,
  FinalizarEntrevistaResponse,
  IntentoEntrevistaIaAdminResponse,
  IntentoEntrevistaIaParticipanteResponse,
  ListarIntentosEntrevistaIaQuery,
  ajustarEntrevistaBodySchema,
  anularEntrevistaBodySchema,
  enviarTurnoSchema,
  finalizarEntrevistaBodySchema,
  listarIntentosEntrevistaIaQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { z } from "zod"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { EntrevistaIaService } from "./entrevista-ia.service"

const idempotencyKeyUuidSchema = z.string().uuid()

function requireIdempotencyKeyUuid(headerValue: string | undefined): string {
  if (headerValue === undefined || !idempotencyKeyUuidSchema.safeParse(headerValue).success) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.idempotencyKeyRequerida,
      message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
    })
  }
  return headerValue
}

/**
 * Controller del modulo `entrevista-ia` (Slice 8 P8c — 9 endpoints E12..E20).
 *
 *  - GET    /cursos/:cursoId/entrevista-ia                              E12
 *  - GET    /asignaciones/:id/entrevista-ia/disponibilidad              E13
 *  - POST   /asignaciones/:id/intentos-entrevista-ia                    E14 (rate 5/h, idempotent)
 *  - POST   /intentos-entrevista-ia/:id/turnos                          E15 (throttle 60/min)
 *  - POST   /intentos-entrevista-ia/:id/finalizar                       E16
 *  - GET    /intentos-entrevista-ia/:id                                 E17
 *  - GET    /asignaciones/:id/intentos-entrevista-ia                    E18
 *  - POST   /intentos-entrevista-ia/:id/ajustar                         E19 (admin + X-Motivo)
 *  - POST   /intentos-entrevista-ia/:id/anular                          E20 (admin + X-Motivo + idempotent)
 */
@Controller()
export class EntrevistaIaController {
  constructor(
    private readonly entrevista: EntrevistaIaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // E12
  @Get("cursos/:cursoId/entrevista-ia")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerPorCurso(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<EntrevistaIaResponse> {
    return this.entrevista.obtenerPorCurso(cursoId, this.requireUsuario(usuario))
  }

  // E13
  @Get("asignaciones/:asignacionId/entrevista-ia/disponibilidad")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerDisponibilidad(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<DisponibilidadEntrevistaIaResponse> {
    return this.entrevista.obtenerDisponibilidad(asignacionId, this.requireUsuario(usuario))
  }

  // E14
  @Post("asignaciones/:asignacionId/intentos-entrevista-ia")
  @Roles(RolUsuario.PARTICIPANTE)
  // D-S8-D3 — 5 intentos por hora por usuario.
  @Throttle({ entrevistaIa: { ttl: 60 * 60 * 1000, limit: 5 } })
  async crearIntento(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<CrearIntentoEntrevistaIaResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    const resultado = await this.entrevista.crearIntento({
      asignacionId,
      idempotencyKey: key,
      usuario: sesion,
    })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_ENTREVISTA_IA_CREADO,
      exito: true,
      recursoTipo: "intento_entrevista_ia",
      recursoId: resultado.intentoId,
      metadata: { asignacionId },
      ...extractContextoHttp(req),
    })
    return resultado
  }

  // E15
  @Post("intentos-entrevista-ia/:intentoId/turnos")
  @Roles(RolUsuario.PARTICIPANTE)
  // D-S8-D2 — chat normal: 60 turnos por minuto.
  @Throttle({ entrevistaTurnos: { ttl: 60 * 1000, limit: 60 } })
  @HttpCode(HttpStatus.OK)
  enviarTurno(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(enviarTurnoSchema)) body: EnviarTurnoInput,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<EnviarTurnoResponse> {
    const sesion = this.requireUsuario(usuario)
    return this.entrevista.enviarTurno({ intentoId, body, usuario: sesion })
  }

  // E16
  @Post("intentos-entrevista-ia/:intentoId/finalizar")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.OK)
  async finalizar(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(finalizarEntrevistaBodySchema))
    _body: FinalizarEntrevistaBodyInput,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<FinalizarEntrevistaResponse> {
    const sesion = this.requireUsuario(usuario)
    const resultado = await this.entrevista.finalizar({ intentoId, usuario: sesion })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_ENTREVISTA_IA_FINALIZADO,
      exito: true,
      recursoTipo: "intento_entrevista_ia",
      recursoId: resultado.intentoId,
      metadata: {
        notaGlobal: resultado.notaGlobal,
        aprobado: resultado.aprobado,
        skillsActualizadas: resultado.skillsActualizadas.length,
      },
      ...extractContextoHttp(req),
    })
    return resultado
  }

  // E17
  @Get("intentos-entrevista-ia/:intentoId")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerIntento(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<IntentoEntrevistaIaAdminResponse | IntentoEntrevistaIaParticipanteResponse> {
    return this.entrevista.obtenerIntento(intentoId, this.requireUsuario(usuario))
  }

  // E18
  @Get("asignaciones/:asignacionId/intentos-entrevista-ia")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  listarIntentos(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Query(new ZodValidationPipe(listarIntentosEntrevistaIaQuerySchema))
    query: ListarIntentosEntrevistaIaQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<
    Paginated<IntentoEntrevistaIaAdminResponse | IntentoEntrevistaIaParticipanteResponse>
  > {
    return this.entrevista.listarIntentos({
      asignacionId,
      query,
      usuario: this.requireUsuario(usuario),
    })
  }

  // E19
  @Post("intentos-entrevista-ia/:intentoId/ajustar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async ajustar(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(ajustarEntrevistaBodySchema)) body: AjustarEntrevistaBodyInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AjustarEntrevistaResponse> {
    const sesion = this.requireUsuario(usuario)
    if (typeof motivo !== "string" || motivo.length === 0) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.motivoRequerido,
        message: "X-Motivo es obligatorio para ajustar.",
      })
    }
    const resultado = await this.entrevista.ajustar({
      intentoId,
      notaAjustada: body.notaAjustada,
      motivo,
      usuario: sesion,
    })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_ENTREVISTA_IA_AJUSTADO,
      exito: true,
      recursoTipo: "intento_entrevista_ia",
      recursoId: resultado.intentoId,
      metadata: {
        notaAjustada: resultado.notaAjustadaAdmin,
        skillsRecalculadas: resultado.skillsRecalculadas.length,
        motivoLength: motivo.length,
      },
      ...extractContextoHttp(req),
    })
    return resultado
  }

  // E20
  @Post("intentos-entrevista-ia/:intentoId/anular")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async anular(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(anularEntrevistaBodySchema)) _body: AnularEntrevistaBodyInput,
    @Motivo() motivo: string | undefined,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AnularEntrevistaResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    if (typeof motivo !== "string" || motivo.length === 0) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.motivoRequerido,
        message: "X-Motivo es obligatorio para anular.",
      })
    }
    const { response, replay } = await this.entrevista.anular({
      intentoId,
      motivo,
      idempotencyKey: key,
      usuario: sesion,
    })
    if (!replay) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.INTENTO_ENTREVISTA_IA_ANULADO,
        exito: true,
        recursoTipo: "intento_entrevista_ia",
        recursoId: response.intentoId,
        metadata: {
          motivoLength: motivo.length,
          skillsRecalculadas: response.skillsRecalculadas.length,
        },
        ...extractContextoHttp(req),
      })
    }
    return response
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
