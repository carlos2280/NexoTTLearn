import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common"
import {
  ClienteDetalleResponse,
  ClienteResponse,
  ListarClientesQuery,
  Paginated,
  listarClientesQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
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
}
