import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common"
import {
  ListarModulosQuery,
  ModuloResponse,
  Paginated,
  listarModulosQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { ModulosService } from "./modulos.service"

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
}
