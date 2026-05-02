import { Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "../common/prisma/prisma.service"

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)

  constructor(private readonly prisma: PrismaService) {}

  async verificarBaseDatos(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (err) {
      this.logger.error("Healthcheck BD fallido", err instanceof Error ? err.stack : err)
      return false
    }
  }
}
