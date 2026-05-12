import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  ListarNotificacionesQuery,
  NotificacionBadgeResponse,
  PatchPreferenciasNotificacionInput,
  listarNotificacionesQuerySchema,
  patchPreferenciasNotificacionSchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request } from "express"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotificacionesService } from "./notificaciones.service"
import {
  NotificacionDetalle,
  NotificacionResumen,
  PreferenciasNotificacion,
} from "./notificaciones.types"

/**
 * Controller del modulo notificaciones (Slice 10 P10b — 8 endpoints).
 *
 *  E1 GET    /notificaciones                          — listado paginado.
 *  E2 GET    /notificaciones/badge                    — conteo no-leidas (throttle 5/s).
 *  E3 GET    /notificaciones/:notificacionId          — detalle.
 *  E4 POST   /notificaciones/:notificacionId/marcar-leida — 204.
 *  E5 POST   /notificaciones/marcar-todas-leidas      — 204.
 *  E6 POST   /notificaciones/:notificacionId/archivar — 204.
 *  E7 GET    /notificaciones/preferencias             — estado preferencias.
 *  E8 PATCH  /notificaciones/preferencias             — silenciar/desilenciar + audit.
 *
 * Visibilidad D90 / D-S10-C7: el service filtra `usuario_id = sesion.usuarioId`
 * en todas las queries. 404 `notificacionNoEncontrada` cuando la notif
 * pertenece a otro usuario — mismo mensaje que "no existe" para no revelar
 * existencia.
 *
 * El orden de los handlers importa: las rutas literales (`badge`,
 * `marcar-todas-leidas`, `preferencias`) van ANTES de las parametricas (`:id`)
 * para que el router de Nest no las trate como ids.
 */
@Controller("notificaciones")
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  // E1
  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  listar(
    @Query(new ZodValidationPipe(listarNotificacionesQuerySchema))
    query: ListarNotificacionesQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<NotificacionResumen>> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.listarPorUsuario({ usuarioId: sesion.usuarioId, query })
  }

  // E2 — Throttle agresivo (R-S10-1): el frontend hace polling de la campanita.
  @Get("badge")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @Throttle({ short: { ttl: 1000, limit: 5 } })
  async badge(
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<NotificacionBadgeResponse> {
    const sesion = this.requireUsuario(usuario)
    const noLeidas = await this.notificaciones.contarNoLeidas(sesion.usuarioId)
    return { noLeidas }
  }

  // E7 — antes de `:notificacionId` para que la ruta literal gane.
  @Get("preferencias")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  preferencias(
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<PreferenciasNotificacion> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.obtenerPreferencias(sesion.usuarioId)
  }

  // E8
  @Patch("preferencias")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.OK)
  actualizarPreferencias(
    @Body(new ZodValidationPipe(patchPreferenciasNotificacionSchema))
    body: PatchPreferenciasNotificacionInput,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<PreferenciasNotificacion> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.actualizarPreferencias(
      sesion.usuarioId,
      body,
      extractContextoHttp(req),
    )
  }

  // E5 — antes de `:notificacionId` para que la ruta literal gane.
  @Post("marcar-todas-leidas")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarTodasLeidas(@CurrentUser() usuario: SesionUsuario | undefined): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.marcarTodasLeidas(sesion.usuarioId)
  }

  // E3
  @Get(":notificacionId")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerDetalle(
    @Param("notificacionId", ParseUUIDPipe) notificacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<NotificacionDetalle> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.obtenerDetalle(sesion.usuarioId, notificacionId)
  }

  // E4
  @Post(":notificacionId/marcar-leida")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarLeida(
    @Param("notificacionId", ParseUUIDPipe) notificacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.marcarLeida(sesion.usuarioId, notificacionId)
  }

  // E6
  @Post(":notificacionId/archivar")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  archivar(
    @Param("notificacionId", ParseUUIDPipe) notificacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    return this.notificaciones.archivar(sesion.usuarioId, notificacionId)
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
