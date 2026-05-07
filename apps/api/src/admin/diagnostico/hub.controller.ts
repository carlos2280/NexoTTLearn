import { Controller, Get, UseGuards } from "@nestjs/common"
import type { HubDiagnosticoResponse } from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { HubDiagnosticoService } from "./hub.service"

@Controller("admin/diagnostico/hub")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class HubDiagnosticoController {
  constructor(private readonly service: HubDiagnosticoService) {}

  @Get()
  obtener(): Promise<HubDiagnosticoResponse> {
    return this.service.obtenerHub()
  }
}
