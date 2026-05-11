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
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  CrearIntentoBloqueInput,
  IntentoBloqueResponse,
  ListarIntentosBloqueQuery,
  ListarIntentosCursoBloqueQuery,
  crearIntentoBloqueSchema,
  listarIntentosBloqueQuerySchema,
  listarIntentosCursoBloqueQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
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
import { requireIdempotencyKeyUuid } from "./intentos-bloque.helpers"
import { IntentosBloqueService } from "./intentos-bloque.service"

/**
 * Controller del modulo `intentos-bloque` (Slice 7 P7b). 5 endpoints:
 *  - `POST /intentos-bloque` (PARTICIPANTE, Idempotency-Key obligatoria, 30/min).
 *  - `GET /colaboradores/:id/bloques/:id/intentos` (admin o propio, D-AS-9).
 *  - `GET /colaboradores/:id/bloques/:id/mejor-intento` (admin o propio).
 *  - `GET /cursos/:id/bloques/:id/intentos` (admin only).
 *  - `POST /intentos-bloque/:id/invalidar` (admin con X-Motivo, audit).
 *
 * Audit `INTENTO_BLOQUE_INVALIDADO` se registra aqui fuera del TX (D-AUDIT-1).
 * `INTENTO_BLOQUE_REGISTRADO` NO se audita (D-S7-D4) — la fila `IntentoBloque`
 * es el audit funcional.
 */
@Controller()
export class IntentosBloqueController {
  constructor(
    private readonly intentosService: IntentosBloqueService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Post("intentos-bloque")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async crear(
    @Body(new ZodValidationPipe(crearIntentoBloqueSchema)) body: CrearIntentoBloqueInput,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<IntentoBloqueResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    const resultado = await this.intentosService.crear({
      body,
      idempotencyKey: key,
      usuario: sesion,
    })
    return resultado.body
  }

  @Get("colaboradores/:colaboradorId/bloques/:bloqueId/intentos")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listarPorColaboradorYBloque(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @Param("bloqueId", ParseUUIDPipe) bloqueId: string,
    @Query(new ZodValidationPipe(listarIntentosBloqueQuerySchema))
    query: ListarIntentosBloqueQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<IntentoBloqueResponse>> {
    return await this.intentosService.listarPorColaboradorYBloque({
      colaboradorId,
      bloqueId,
      query,
      usuario: this.requireUsuario(usuario),
    })
  }

  @Get("colaboradores/:colaboradorId/bloques/:bloqueId/mejor-intento")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtenerMejorIntento(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @Param("bloqueId", ParseUUIDPipe) bloqueId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<IntentoBloqueResponse | null> {
    return await this.intentosService.obtenerMejorIntento({
      colaboradorId,
      bloqueId,
      usuario: this.requireUsuario(usuario),
    })
  }

  @Get("cursos/:cursoId/bloques/:bloqueId/intentos")
  @Roles(RolUsuario.ADMIN)
  async listarPorCursoYBloque(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Param("bloqueId", ParseUUIDPipe) bloqueId: string,
    @Query(new ZodValidationPipe(listarIntentosCursoBloqueQuerySchema))
    query: ListarIntentosCursoBloqueQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<IntentoBloqueResponse>> {
    this.requireUsuario(usuario)
    return await this.intentosService.listarPorCursoYBloque({
      cursoId,
      bloqueId,
      query,
    })
  }

  @Post("intentos-bloque/:intentoId/invalidar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async invalidar(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<IntentoBloqueResponse> {
    const sesion = this.requireUsuario(usuario)
    const resultado = await this.intentosService.invalidar({
      intentoId,
      motivo: motivo ?? "",
    })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_BLOQUE_INVALIDADO,
      exito: true,
      recursoTipo: "intento_bloque",
      recursoId: intentoId,
      metadata: {
        bloqueId: resultado.bloqueId,
        colaboradorId: resultado.colaboradorId,
        motivoLength: resultado.motivoLength,
      },
      ...extractContextoHttp(req),
    })
    return resultado.intento
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
