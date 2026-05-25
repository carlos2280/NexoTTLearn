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
   * Ejecuta un DELETE batched en SQL. Devuelve el numero de filas afectadas.
   *
   * La subquery filtra solo por `created_at` (sin `usuario_id`), por lo que
   * Postgres NO puede usar el indice compuesto column-leading
   * `idx_activity_logs_usuario (usuario_id, created_at DESC)`. El planner
   * elige seq scan o bitmap index scan segun estadisticas; para purga diaria
   * batched de 1000 filas el coste es aceptable. Si futuras mediciones
   * EXPLAIN ANALYZE muestran tiempos crecientes, candidato a indice dedicado
   * `(created_at)` evaluado caso por caso.
   *
   * Se usa `$executeRaw` parametrizado (no `$executeRawUnsafe`).
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
