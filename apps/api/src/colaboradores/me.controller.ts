import { Controller, Get, InternalServerErrorException } from "@nestjs/common"
import { FichaResponse } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { SesionUsuario } from "../common/types/sesion.types"
import { FichaService } from "./ficha/ficha.service"

/**
 * Endpoints autoservicio bajo `/me`. P5a solo expone la ficha; futuras rutas
 * (`/me/cursos`, `/me/notificaciones`) viven aqui para mantener un controller
 * dedicado, sin contaminar el de `colaboradores` con resolucion de identidad
 * desde la sesion.
 */
@Controller("me")
export class MeController {
  constructor(private readonly fichaService: FichaService) {}

  /**
   * Atajo equivalente a `GET /colaboradores/<miColaboradorId>/ficha`. La
   * identidad se resuelve desde la sesion (`@CurrentUser`) — jamas del body.
   * ADMIN tambien puede usar el endpoint si su usuario tiene colaborador.
   */
  @Get("ficha")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  async obtenerMiFicha(@CurrentUser() usuario: SesionUsuario | undefined): Promise<FichaResponse> {
    const sesion = this.requireUsuario(usuario)
    return this.fichaService.obtenerFichaDeUsuario(sesion.usuarioId, sesion)
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return usuario
  }
}
