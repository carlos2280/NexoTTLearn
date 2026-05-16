import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * Purga periodica de previews de evaluacion inicial caducados (D-EVI-2):
 * borra los `previewEvaluacionInicial` con `aplicadoEn IS NULL` cuyo
 * `expiraEn` ya quedo atras. El `Archivo` fisico NO se borra — queda en
 * storage como evidencia (D-EVI-1, retencion 5 anios).
 */
@Injectable()
export class PreviewPurgaService {
  private readonly logger = new Logger(PreviewPurgaService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async purgarPreviewsCaducados(): Promise<void> {
    const result = await this.prisma.previewEvaluacionInicial.deleteMany({
      where: { aplicadoEn: null, expiraEn: { lt: new Date() } },
    })
    if (result.count > 0) {
      this.logger.log(`Previews caducados purgados: ${result.count}`)
    }
  }
}
