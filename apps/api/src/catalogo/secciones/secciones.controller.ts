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
  ActualizarSeccionInput,
  CrearSeccionInput,
  ListarSeccionesQuery,
  Paginated,
  ReordenarSeccionesInput,
  SeccionResponse,
  actualizarSeccionSchema,
  crearSeccionSchema,
  listarSeccionesQuerySchema,
  reordenarSeccionesSchema,
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
import { SeccionesService } from "./secciones.service"

@Controller("catalogo")
export class SeccionesController {
  constructor(private readonly seccionesService: SeccionesService) {}

  @Get("secciones")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarSeccionesQuerySchema)) query: ListarSeccionesQuery,
  ): Promise<Paginated<SeccionResponse>> {
    return await this.seccionesService.listar(query)
  }

  @Get("secciones/:id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<SeccionResponse> {
    return await this.seccionesService.obtenerPorIdOrThrow(id)
  }

  @Post("modulos/:moduloId/secciones")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Param("moduloId", ParseUUIDPipe) moduloId: string,
    @Body(new ZodValidationPipe(crearSeccionSchema)) input: CrearSeccionInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<SeccionResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.seccionesService.crear(
      moduloId,
      input,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Patch("modulos/:moduloId/secciones/:seccionId")
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param("moduloId", ParseUUIDPipe) moduloId: string,
    @Param("seccionId", ParseUUIDPipe) seccionId: string,
    @Body(new ZodValidationPipe(actualizarSeccionSchema)) input: ActualizarSeccionInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<SeccionResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.seccionesService.actualizar(
      moduloId,
      seccionId,
      input,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Post("modulos/:moduloId/secciones/orden")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reordenar(
    @Param("moduloId", ParseUUIDPipe) moduloId: string,
    @Body(new ZodValidationPipe(reordenarSeccionesSchema)) input: ReordenarSeccionesInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.seccionesService.reordenar(
      moduloId,
      input,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Delete("modulos/:moduloId/secciones/:seccionId")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param("moduloId", ParseUUIDPipe) moduloId: string,
    @Param("seccionId", ParseUUIDPipe) seccionId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.seccionesService.eliminar(
      moduloId,
      seccionId,
      motivo ?? "",
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }
}
