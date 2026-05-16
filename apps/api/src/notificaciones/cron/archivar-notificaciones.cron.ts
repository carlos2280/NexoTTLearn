import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { PrismaService } from "../../common/prisma/prisma.service"

/** Default cuando `NOTIF_PURGA_CRON` no esta definida en el entorno: 03:00 diarias. */
const CRON_EXPRESSION_DEFAULT = "0 3 * * *"

const DIAS_RETENCION = 30
const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Cron diario de archivado de notificaciones (D-S10-B4 / §19.3 punto 3).
 *
 * Marca `archivada=true` sobre notificaciones con `fecha_creacion < now() - 30d`.
 * No hace hard-delete — las archivadas siguen consultables via `?archivada=true`.
 *
 * Patron heredado de `PreviewPurgaService` (Slice 5, FIX-P5-cierre §5.57).
 * El indice parcial `idx_notif_archivar` mantiene el WHERE acotado a las filas
 * candidatas (R-S10-6).
 *
 * La expresion cron se lee de `process.env.NOTIF_PURGA_CRON` en tiempo de
 * carga del modulo (decorador `@Cron` evaluado al definir la clase). Validada
 * por Zod al arranque, asi que el fallback default solo aplica en contextos de
 * tests o herramientas sin env (ej: import desde scripts).
 */
@Injectable()
export class ArchivarNotificacionesCron {
  private readonly logger = new Logger(ArchivarNotificacionesCron.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(process.env.NOTIF_PURGA_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    const corteFecha = new Date(inicio - DIAS_RETENCION * MS_POR_DIA)

    const result = await this.prisma.notificacion.updateMany({
      where: { archivada: false, fechaCreacion: { lt: corteFecha } },
      data: { archivada: true },
    })

    const duracionMs = Date.now() - inicio
    this.logger.log(`archivar-notif | filas=${result.count} | duracionMs=${duracionMs}`)
  }
}
