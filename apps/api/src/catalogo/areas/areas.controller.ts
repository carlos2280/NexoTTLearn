import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common"
import {
  AreaResponse,
  ListarAreasQuery,
  Paginated,
  listarAreasQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
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
}
