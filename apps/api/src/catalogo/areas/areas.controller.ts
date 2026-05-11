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
  ActualizarAreaInput,
  AreaResponse,
  CrearAreaInput,
  ListarAreasQuery,
  Paginated,
  actualizarAreaSchema,
  crearAreaSchema,
  listarAreasQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Request } from "express"
import { extractContextoHttp } from "../../common/audit/extract-contexto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../../common/types/sesion.types"
import { AreasService } from "./areas.service"

@Controller("catalogo/areas")
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarAreasQuerySchema)) query: ListarAreasQuery,
  ): Promise<Paginated<AreaResponse>> {
    return await this.areasService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<AreaResponse> {
    return await this.areasService.obtenerPorIdOrThrow(id)
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearAreaSchema)) input: CrearAreaInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AreaResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.areasService.crear(input, admin.usuarioId, extractContextoHttp(req))
  }

  @Patch(":id")
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(actualizarAreaSchema)) input: ActualizarAreaInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AreaResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.areasService.actualizar(id, input, admin.usuarioId, extractContextoHttp(req))
  }

  @Delete(":id")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<void> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    await this.areasService.eliminar(id, admin.usuarioId, extractContextoHttp(req))
  }
}
