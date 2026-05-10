// Iter 10 · controller admin para ficha 360° del participante.

import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common"
import type { FichaParticipanteResponse } from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { FichaService } from "./ficha.service"

@Controller("admin/participantes")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class FichaController {
  constructor(private readonly ficha: FichaService) {}

  @Get(":participanteId/ficha")
  obtenerFicha(
    @Param("participanteId", new ParseUUIDPipe()) participanteId: string,
  ): Promise<FichaParticipanteResponse> {
    return this.ficha.obtenerFicha(participanteId)
  }
}
