import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { AuditoriaController } from "./auditoria.controller"
import { AuditoriaService } from "./auditoria.service"
import { PurgaAuditoriaCron } from "./cron/purga-auditoria.cron"

/**
 * `AuditoriaModule` — Slice 12 P12 (D-S12-A1..A9).
 *
 * Expone el visor admin de `activity_logs` (lectura + exportacion CSV) y el
 * cron diario de purga 24 meses. AuditLogService viene inyectado por el
 * `AuditLogModule` global (no se importa explicitamente aqui).
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuditoriaController],
  providers: [AuditoriaService, PurgaAuditoriaCron],
})
export class AuditoriaModule {}
