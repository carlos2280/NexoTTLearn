import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common"
import {
  ListarSkillsQuery,
  Paginated,
  SkillResponse,
  listarSkillsQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { SkillsService } from "./skills.service"

@Controller("catalogo/skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarSkillsQuerySchema)) query: ListarSkillsQuery,
  ): Promise<Paginated<SkillResponse>> {
    return await this.skillsService.listar(query)
  }

  @Get(":id")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(@Param("id", ParseUUIDPipe) id: string): Promise<SkillResponse> {
    return await this.skillsService.obtenerPorIdOrThrow(id)
  }
}
