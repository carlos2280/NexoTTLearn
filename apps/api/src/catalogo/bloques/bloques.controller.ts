import {
  Body,
  Controller,
  Delete,
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
import {
  BloqueDetalleResponse,
  BloqueResponse,
  CrearBloqueInput,
  ListarBloquesQuery,
  Paginated,
  PatchBloqueInput,
  ReordenarBloquesInput,
  crearBloqueSchema,
  listarBloquesQuerySchema,
  patchBloqueSchema,
  reordenarBloquesSchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request } from "express"
import { extractContextoHttp } from "../../common/audit/extract-contexto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Motivo } from "../../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../../common/decorators/requiere-motivo.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../../common/types/sesion.types"
import { BloquesService, EliminarBloqueResponse, PatchBloqueResultado } from "./bloques.service"

@Controller("catalogo")
export class BloquesController {
  constructor(private readonly bloquesService: BloquesService) {}

  @Get("bloques")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarBloquesQuerySchema)) query: ListarBloquesQuery,
  ): Promise<Paginated<BloqueResponse>> {
    return await this.bloquesService.listar(query)
  }

  @Get("secciones/:seccionId/bloques")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listarPorSeccion(
    @Param("seccionId", ParseUUIDPipe) seccionId: string,
  ): Promise<readonly BloqueResponse[]> {
    return await this.bloquesService.listarPorSeccion(seccionId)
  }

  /**
   * Devuelve los bloques ACTIVOS de la seccion con su `contenido` incluido en
   * una sola query. Sustituye al patron N+1 que hacia el frontend (un GET por
   * bloque, ver `use-bloques-de-seccion.ts`).
   */
  @Get("secciones/:seccionId/contenido")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtenerContenidoPorSeccion(
    @Param("seccionId", ParseUUIDPipe) seccionId: string,
  ): Promise<readonly BloqueDetalleResponse[]> {
    return await this.bloquesService.obtenerContenidoPorSeccion(seccionId)
  }

  @Get("bloques/:id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<BloqueDetalleResponse> {
    return await this.bloquesService.obtenerPorIdOrThrow(id)
  }

  @Post("secciones/:seccionId/bloques")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Param("seccionId", ParseUUIDPipe) seccionId: string,
    @Body(new ZodValidationPipe(crearBloqueSchema)) input: CrearBloqueInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<BloqueDetalleResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.bloquesService.crear(
      seccionId,
      input,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Patch("bloques/:bloqueId")
  @Roles(RolUsuario.ADMIN)
  async patch(
    @Param("bloqueId", ParseUUIDPipe) bloqueId: string,
    @Body(new ZodValidationPipe(patchBloqueSchema)) input: PatchBloqueInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<PatchBloqueResultado> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.bloquesService.patch(
      bloqueId,
      input,
      motivo,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Post("secciones/:seccionId/bloques/orden")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reordenar(
    @Param("seccionId", ParseUUIDPipe) seccionId: string,
    @Body(new ZodValidationPipe(reordenarBloquesSchema)) input: ReordenarBloquesInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.bloquesService.reordenar(seccionId, input, admin.usuarioId, extractContextoHttp(req))
  }

  @Delete("bloques/:bloqueId")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async eliminar(
    @Param("bloqueId", ParseUUIDPipe) bloqueId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<EliminarBloqueResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.bloquesService.eliminarSoft(
      bloqueId,
      motivo ?? "",
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }
}
