import { Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "../common/prisma/prisma.service"

export type EstadoBaseDatos = "ok" | "down"

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)

  constructor(private readonly prisma: PrismaService) {}

  async chequearBaseDatos(): Promise<EstadoBaseDatos> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return "ok"
    } catch (error) {
      const detalle = error instanceof Error ? error.message : "desconocido"
      this.logger.error(`Healthcheck DB fallo: ${detalle}`)
      return "down"
    }
  }
}
