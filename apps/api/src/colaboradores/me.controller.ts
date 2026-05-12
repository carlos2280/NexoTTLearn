import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import type { FichaResponse, MeAvanceCursoResponse } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { SesionUsuario } from "../common/types/sesion.types"
import { FichaService } from "./ficha/ficha.service"
import { MeAvanceService } from "./me-avance.service"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Endpoints autoservicio bajo `/me`.
 *
 *  P5a — `/me/ficha`
 *  P11c — `/me/avance/cursos/:cursoId` (D-S11-C8, cap. 10.7).
 *
 * La identidad SIEMPRE viene de la sesion (`@CurrentUser`), jamas del path,
 * body o query. ADMIN puede usar los endpoints si su usuario tiene
 * colaborador asociado (uso operativo cruzado).
 */
@Controller("me")
export class MeController {
  constructor(
    private readonly fichaService: FichaService,
    private readonly meAvanceService: MeAvanceService,
  ) {}

  @Get("ficha")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  async obtenerMiFicha(@CurrentUser() usuario: SesionUsuario | undefined): Promise<FichaResponse> {
    const sesion = this.requireUsuario(usuario)
    return await this.fichaService.obtenerFichaDeUsuario(sesion.usuarioId, sesion)
  }

  @Get("avance/cursos/:cursoId")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  obtenerMiAvanceCurso(
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Param("cursoId") cursoId: string,
  ): Promise<MeAvanceCursoResponse> {
    const sesion = this.requireUsuario(usuario)
    if (!UUID_REGEX.test(cursoId)) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidQuery,
        message: "cursoId no es un UUID valido.",
      })
    }
    return this.meAvanceService.obtenerAvanceDeUsuario(sesion.usuarioId, cursoId)
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
