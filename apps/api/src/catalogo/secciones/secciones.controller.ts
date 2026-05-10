import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common"
import {
  ListarSeccionesQuery,
  Paginated,
  SeccionResponse,
  listarSeccionesQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { SeccionesService } from "./secciones.service"

@Controller("catalogo/secciones")
export class SeccionesController {
  constructor(private readonly seccionesService: SeccionesService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarSeccionesQuerySchema)) query: ListarSeccionesQuery,
  ): Promise<Paginated<SeccionResponse>> {
    return await this.seccionesService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<SeccionResponse> {
    return await this.seccionesService.obtenerPorIdOrThrow(id)
  }
}
