import { Controller, Get, HttpCode, HttpStatus, Res } from "@nestjs/common"
import { Response } from "express"
import { Public } from "../common/decorators/public.decorator"
import { EstadoBaseDatos, HealthService } from "./health.service"

interface HealthResponse {
  readonly status: "ok" | "degraded"
  readonly database: EstadoBaseDatos
}

/**
 * Healthcheck publico (convenciones API §1).
 *
 * - 200 OK con `{status:"ok",database:"ok"}` cuando la DB responde.
 * - 503 SERVICE_UNAVAILABLE con `{status:"degraded",database:"down"}` si
 *   `SELECT 1` lanza (Railway considera "down" cualquier no-200 sostenido y
 *   reinicia el servicio).
 *
 * Queda fuera del prefijo /api/v1 para mantener URL estable independientemente
 * del versionado del API publico.
 */
@Controller("api/health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const databaseStatus = await this.healthService.chequearBaseDatos()
    if (databaseStatus === "down") {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
      return { status: "degraded", database: databaseStatus }
    }
    return { status: "ok", database: databaseStatus }
  }
}
