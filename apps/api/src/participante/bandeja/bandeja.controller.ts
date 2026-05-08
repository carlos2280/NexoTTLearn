// Controller de la bandeja del participante. Read-only, RolGuard PARTICIPANTE.

import { Controller, Get, UseGuards } from "@nestjs/common"
import type { ParticipanteBandejaResponse } from "@nexott-learn/shared-types"
import type { UsuarioSesion } from "../../auth/tipos"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { BandejaService } from "./bandeja.service"

@Controller("participante/bandeja")
@UseGuards(SesionGuard, RolGuard)
@Roles("PARTICIPANTE")
export class BandejaController {
  constructor(private readonly bandeja: BandejaService) {}

  @Get()
  obtenerBandeja(@UsuarioActual() usuario: UsuarioSesion): Promise<ParticipanteBandejaResponse> {
    return this.bandeja.obtenerBandeja(usuario.id)
  }
}
