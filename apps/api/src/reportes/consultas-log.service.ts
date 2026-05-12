import { Injectable, Logger } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"

/**
 * `ConsultasLogService` — D-S11-C4 + DE-P11c-1.
 *
 * Audit best-effort de consultas a reportes estrategicos. El INSERT puebla
 * SIEMPRE las 5 columnas de negocio (`autorUsuarioId`, `endpoint`,
 * `queryParams`, `latenciaMs`, `fecha`) y duplica los valores en las columnas
 * legacy (`tipoLog`, `filtros`) para mantener compatibilidad con el schema
 * pre-existente (NOT NULL en `tipoLog`).
 *
 * Reglas duras:
 *   - `registrar()` es fire-and-forget: cualquier error se loggea con
 *     `Logger.warn` SIN propagarlo al request en curso.
 *   - Solo se loggea POST-exito del endpoint (el caller decide).
 *   - La identidad SIEMPRE viene de la sesion verificada (`@CurrentUser`).
 *
 * TODO(§5.129): retirar `tipoLog` y `filtros` tras migracion destructiva
 * planificada (FIX-S12 o cleanup dedicado). La duplicacion temporal mantiene
 * el contrato NOT NULL del schema existente.
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
          // TODO(§5.129): legacy — duplica valores hasta cleanup.
          tipoLog: input.endpoint,
          filtros: input.queryParams as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Audit log fallo (endpoint=${input.endpoint}): ${detalle}`)
    }
  }
}
