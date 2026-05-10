import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common"
import {
  BloqueDetalleResponse,
  BloqueResponse,
  ListarBloquesQuery,
  Paginated,
  listarBloquesQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { BloquesService } from "./bloques.service"

@Controller("catalogo/bloques")
export class BloquesController {
  constructor(private readonly bloquesService: BloquesService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarBloquesQuerySchema)) query: ListarBloquesQuery,
  ): Promise<Paginated<BloqueResponse>> {
    return await this.bloquesService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<BloqueDetalleResponse> {
    return await this.bloquesService.obtenerPorIdOrThrow(id)
  }
}
