import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import type {
  RepararSkillsCursoPreview,
  RepararSkillsCursoResponse,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"

import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { SesionUsuario } from "../../common/types/sesion.types"
import { RepararSkillsCursoService } from "./reparar-skills.service"

/**
 * Reparar skills de un curso ya cargado — ADMIN:
 *  - `GET  /cursos/:cursoId/reparar-skills` → que cambiaria (sin escribir).
 *  - `POST /cursos/:cursoId/reparar-skills` → lo aplica y recalcula planes.
 * Controller delgado: la logica vive en `RepararSkillsCursoService`.
 */
@Controller()
export class RepararSkillsCursoController {
  constructor(private readonly repararSkillsService: RepararSkillsCursoService) {}

  @Get("cursos/:cursoId/reparar-skills")
  @Roles(RolUsuario.ADMIN)
  async previsualizar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
  ): Promise<RepararSkillsCursoPreview> {
    return await this.repararSkillsService.previsualizar(cursoId)
  }

  @Post("cursos/:cursoId/reparar-skills")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  // Recalcula todos los planes del curso y notifica a cada asignado.
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async reparar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<RepararSkillsCursoResponse> {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return await this.repararSkillsService.reparar(cursoId, usuario.usuarioId)
  }
}
