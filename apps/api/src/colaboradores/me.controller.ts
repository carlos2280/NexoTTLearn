import { Controller, Get, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { FichaResponse } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
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
  constructor(
    private readonly fichaService: FichaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Atajo equivalente a `GET /colaboradores/<miColaboradorId>/ficha`. La
   * identidad se resuelve desde la sesion (`@CurrentUser`) — jamas del body.
   * ADMIN tambien puede usar el endpoint si su usuario tiene colaborador.
   */
  @Get("ficha")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  async obtenerMiFicha(@CurrentUser() usuario: SesionUsuario | undefined): Promise<FichaResponse> {
    const sesion = this.requireUsuario(usuario)
    const usuarioRow = await this.prisma.usuario.findUnique({
      where: { id: sesion.usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuarioRow) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    return await this.fichaService.obtenerFicha(usuarioRow.colaboradorId, sesion)
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
