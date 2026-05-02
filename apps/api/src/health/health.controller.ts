import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common"
import { HealthService } from "./health.service"

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<{
    status: "ok" | "degraded"
    uptime: number
    timestamp: string
    checks: { database: "ok" | "error" }
  }> {
    const databaseOk = await this.healthService.verificarBaseDatos()
    return {
      status: databaseOk ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseOk ? "ok" : "error",
      },
    }
  }
}
