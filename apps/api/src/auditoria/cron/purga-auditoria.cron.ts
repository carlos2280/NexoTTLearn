import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../../common/prisma/prisma.service"

const CRON_EXPRESSION_DEFAULT = "0 3 * * *"
const RETENCION_MESES = 24
const BATCH_SIZE = 1000
const MAX_ITERACIONES = 1000

/**
 * `PurgaAuditoriaCron` — Slice 12 P12 (D-S12-A4).
 *
 * Cron diario (default 03:00 UTC) que elimina filas de `activity_logs` con
 * `created_at < NOW() - INTERVAL '24 months'`. Operacion batched
 * (`LIMIT 1000` por iteracion) para no bloquear la tabla en produccion.
 *
 * Patron heredado de `ConsultasLogPurgaCron` (P11c). Try/catch global para que
 * un fallo en una iteracion no rompa el loop ni propague al schedule
 * (R-S10-2 / R-S12-4). La expresion cron se lee de
 * `process.env.PURGA_AUDITORIA_CRON` al cargar el modulo (validada Zod).
 */
@Injectable()
export class PurgaAuditoriaCron {
  private readonly logger = new Logger(PurgaAuditoriaCron.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron(process.env.PURGA_AUDITORIA_CRON ?? CRON_EXPRESSION_DEFAULT)
  async ejecutar(): Promise<void> {
    const inicio = Date.now()
    let borradas = 0
    let iteraciones = 0
    try {
      while (iteraciones < MAX_ITERACIONES) {
        iteraciones += 1
        const filas = await this.borrarLote()
        borradas += filas
        if (filas === 0) {
          break
        }
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(
        `purga-auditoria | fallo | borradas=${borradas} | iteraciones=${iteraciones} | error=${detalle}`,
      )
      return
    }

    const duracionMs = Date.now() - inicio
    this.logger.log(
      `purga-auditoria | borradas=${borradas} | iteraciones=${iteraciones} | duracionMs=${duracionMs}`,
    )
  }

  /**
   * Ejecuta un DELETE batched en SQL para aprovechar el indice
   * `idx_activity_logs_usuario` (created_at desc) + filtro temporal.
   * Devuelve el numero de filas afectadas en la iteracion.
   *
   * Se usa `$executeRaw` parametrizado (no `$executeRawUnsafe`); Prisma escapa
   * el `INTERVAL` literal porque va embebido como string. La constante
   * `RETENCION_MESES` se valida al compilar (literal numerico).
   */
  private async borrarLote(): Promise<number> {
    const result = await this.prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM "activity_logs"
        WHERE "id" IN (
          SELECT "id" FROM "activity_logs"
          WHERE "created_at" < NOW() - (${`${RETENCION_MESES} months`}::interval)
          ORDER BY "created_at" ASC
          LIMIT ${BATCH_SIZE}
        )
      `,
    )
    return Number(result)
  }
}
