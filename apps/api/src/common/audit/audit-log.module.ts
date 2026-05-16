import { Global, Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { AuditLogService } from "./audit-log.service"

/**
 * Modulo global del audit log estructural. Cualquier service del backend
 * inyecta `AuditLogService` sin reimportar este modulo. Decision (D-AUDIT):
 * @Global por ser infraestructura transversal (mismo patron que PrismaModule
 * de hecho podria moverse a global tambien, pero se mantiene explicito en
 * cada feature por convencion del paraguas).
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
