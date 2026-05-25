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
  ActualizarModuloInput,
  CrearModuloInput,
  ListarModulosQuery,
  ModuloResponse,
  Paginated,
  actualizarModuloSchema,
  crearModuloSchema,
  listarModulosQuerySchema,
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
import { ArchivarModuloResponse, ModulosService } from "./modulos.service"

@Controller("catalogo/modulos")
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarModulosQuerySchema)) query: ListarModulosQuery,
  ): Promise<Paginated<ModuloResponse>> {
    return await this.modulosService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<ModuloResponse> {
    return await this.modulosService.obtenerPorIdOrThrow(id)
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearModuloSchema)) input: CrearModuloInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ModuloResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.modulosService.crear(input, admin.usuarioId, extractContextoHttp(req))
  }

  /**
   * D-CAT-13: PATCH solo exige X-Motivo si cambia `titulo`. Como el
   * `MotivoGuard` global aplica la regla por endpoint, aqui NO decoramos con
   * `@RequiereMotivo()` y la validacion del motivo se delega al service.
   */
  @Patch(":id")
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(actualizarModuloSchema)) input: ActualizarModuloInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ModuloResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.modulosService.actualizar(
      id,
      input,
      motivo,
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Post(":id/archivar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async archivar(
    @Param("id", ParseUUIDPipe) id: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ArchivarModuloResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.modulosService.archivar(
      id,
      motivo ?? "",
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Post(":id/desarchivar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async desarchivar(
    @Param("id", ParseUUIDPipe) id: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ModuloResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.modulosService.desarchivar(
      id,
      motivo ?? "",
      admin.usuarioId,
      extractContextoHttp(req),
    )
  }

  @Delete(":id")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(
    @Param("id", ParseUUIDPipe) id: string,
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
    await this.modulosService.eliminar(id, motivo ?? "", admin.usuarioId, extractContextoHttp(req))
  }
}
