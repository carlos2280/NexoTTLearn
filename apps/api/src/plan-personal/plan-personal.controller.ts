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
import type { PlanResponseAdmin, PlanResponseParticipante } from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { SesionUsuario } from "../common/types/sesion.types"
import { PlanPersonalService } from "./plan-personal.service"

/**
 * Controller del modulo plan-personal (Slice 7 P7a). 3 endpoints:
 *  - `POST /asignaciones/:id/plan/calcular`   — ADMIN.
 *  - `POST /asignaciones/:id/plan/recalcular` — ADMIN, X-Motivo, 10/min.
 *  - `GET  /asignaciones/:id/plan`            — ADMIN o propio (D-AS-9).
 *
 * Audit: D-S7-D4 — `PLAN_CALCULADO` NO se audita; `PLAN_RECALCULADO` llega
 * en P7b cuando el enum tenga el valor (TODO inline en el service).
 */
@Controller()
export class PlanPersonalController {
  constructor(private readonly planService: PlanPersonalService) {}

  @Post("asignaciones/:asignacionId/plan/calcular")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async calcular(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<PlanResponseAdmin> {
    this.requireUsuario(usuario)
    return await this.planService.calcularExplicito(asignacionId)
  }

  @Post("asignaciones/:asignacionId/plan/recalcular")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async recalcular(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<PlanResponseAdmin> {
    const sesion = this.requireUsuario(usuario)
    return await this.planService.recalcular(asignacionId, sesion.usuarioId, motivo ?? "")
  }

  @Get("asignaciones/:asignacionId/plan")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<PlanResponseAdmin | PlanResponseParticipante> {
    return await this.planService.obtener(asignacionId, this.requireUsuario(usuario))
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
