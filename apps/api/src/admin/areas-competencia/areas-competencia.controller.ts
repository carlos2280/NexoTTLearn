import { Controller, Get, UseGuards } from "@nestjs/common"
import type { ObtenerAreasCompetenciaResponse } from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { AreasCompetenciaService } from "./areas-competencia.service"

@Controller("admin/areas-competencia")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class AreasCompetenciaController {
  constructor(private readonly areasService: AreasCompetenciaService) {}

  @Get()
  obtenerAreas(): Promise<ObtenerAreasCompetenciaResponse> {
    return this.areasService.obtenerAreas()
  }
}
