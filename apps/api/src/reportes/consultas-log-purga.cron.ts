import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { PrismaService } from "../common/prisma/prisma.service"

const CRON_EXPRESSION_DEFAULT = "0 4 * * *"
const DIAS_RETENCION = 90
const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * `ConsultasLogPurgaCron` — D-S11-C4 (retencion 90 dias).
 *
 * Cron diario (default 04:00, despues del recalculo de cache 03:00) que
 * hace hard-delete sobre filas de `consultas_logs` con `fecha < now()-90d`.
 *
 * Patron heredado de `ArchivarNotificacionesCron` (P10a). La expresion cron
 * se lee de `process.env.CONSULTAS_PURGA_CRON` en tiempo de carga del modulo.
 */
@Injectable()
export class ConsultasLogPurgaCron {
  private readonly logger = new Logger(ConsultasLogPurgaCron.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(process.env.CONSULTAS_PURGA_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    const corteFecha = new Date(inicio - DIAS_RETENCION * MS_POR_DIA)

    const result = await this.prisma.consultaLog.deleteMany({
      where: { fecha: { lt: corteFecha } },
    })

    const duracionMs = Date.now() - inicio
    this.logger.log(`consultas-purga | filas=${result.count} | duracionMs=${duracionMs}`)
  }
}
