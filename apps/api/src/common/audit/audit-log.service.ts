import { Injectable, Logger } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { AuditLogInput } from "./audit-log.types"

/**
 * AuditLogService — escritura append-only en `activity_logs` (OWASP A09).
 *
 * Reglas duras:
 *   - `record()` es fire-and-forget. Captura cualquier error del insert y lo
 *     registra con `Logger.error` SIN propagarlo al request en curso. Un fallo
 *     del audit log NO debe romper el endpoint que estaba ejecutandose.
 *   - Solo metadatos. Jamas se escriben aqui passwordHash, mfaSecret, cookies,
 *     tokens ni el body de la request — los services llaman con campos ya
 *     filtrados.
 *   - La identidad (`usuarioId`) la pasa el caller, que SIEMPRE la obtiene de
 *     la sesion verificada o como `null` cuando el evento es pre-autenticacion.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name)

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          usuarioId: input.usuarioId,
          accion: input.accion,
          exito: input.exito,
          recursoTipo: input.recursoTipo ?? null,
          recursoId: input.recursoId ?? null,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          requestId: input.requestId ?? null,
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      })
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.error(
        `Audit log insert fallo (accion=${input.accion} exito=${input.exito}): ${detalle}`,
      )
    }
  }
}
