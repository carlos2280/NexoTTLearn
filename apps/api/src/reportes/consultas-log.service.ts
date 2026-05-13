import { Injectable, Logger } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * `ConsultasLogService` — D-S11-C4 + DE-P11c-1 + cleanup §5.129 (P-B-b).
 *
 * Audit best-effort de consultas a reportes estrategicos y a los visores
 * `/admin/logs/*`. `registrar()` inserta una fila en `consultas_logs` con las
 * cinco columnas de negocio: `autorUsuarioId`, `endpoint`, `queryParams`,
 * `latenciaMs`, `fecha`.
 *
 * Las columnas legacy duplicadas fueron retiradas por la migracion destructiva
 * `20260601000000_slice_b_consultas_logs_cleanup_legacy`. El shape final es
 * estable: cinco columnas y nada mas.
 *
 * Reglas duras:
 *   - `registrar()` es fire-and-forget: cualquier error se loggea con
 *     `Logger.warn` SIN propagarlo al request en curso.
 *   - Solo se loggea POST-exito del endpoint (el caller decide).
 *   - La identidad SIEMPRE viene de la sesion verificada (`@CurrentUser`).
 */
@Injectable()
export class ConsultasLogService {
  private readonly logger = new Logger(ConsultasLogService.name)

  constructor(private readonly prisma: PrismaService) {}

  async registrar(input: {
    readonly autorUsuarioId: string
    readonly endpoint: string
    readonly queryParams: Record<string, unknown>
    readonly latenciaMs?: number
  }): Promise<void> {
    try {
      await this.prisma.consultaLog.create({
        data: {
          autorUsuarioId: input.autorUsuarioId,
          endpoint: input.endpoint,
          queryParams: input.queryParams as Prisma.InputJsonValue,
          latenciaMs: input.latenciaMs ?? null,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Audit log fallo (endpoint=${input.endpoint}): ${detalle}`)
    }
  }
}
