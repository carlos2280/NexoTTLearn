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
  ActualizarClienteInput,
  ClienteDetalleResponse,
  ClienteResponse,
  CrearClienteInput,
  ListarClientesQuery,
  Paginated,
  actualizarClienteSchema,
  crearClienteSchema,
  listarClientesQuerySchema,
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
import { ClientesService } from "./clientes.service"

@Controller("catalogo/clientes")
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarClientesQuerySchema)) query: ListarClientesQuery,
  ): Promise<Paginated<ClienteResponse>> {
    return await this.clientesService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<ClienteDetalleResponse> {
    return await this.clientesService.obtenerPorIdOrThrow(id)
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearClienteSchema)) input: CrearClienteInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ClienteDetalleResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.clientesService.crear(input, admin.usuarioId, extractContextoHttp(req))
  }

  /**
   * PATCH solo exige X-Motivo si cambia `nombre` o `activo`. Si solo cambia
   * `datosContacto`, no se exige (validacion en service).
   */
  @Patch(":id")
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(actualizarClienteSchema)) input: ActualizarClienteInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<ClienteDetalleResponse> {
    if (!admin) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.clientesService.actualizar(
      id,
      input,
      motivo,
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
    await this.clientesService.eliminar(id, motivo ?? "", admin.usuarioId, extractContextoHttp(req))
  }
}
