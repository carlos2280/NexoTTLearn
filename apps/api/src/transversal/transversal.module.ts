import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import { TransversalController } from "./transversal.controller"
import { TransversalService } from "./transversal.service"

/**
 * Modulo `transversal` — Slice 8 P8a. Expone los 6 endpoints del bloque
 * foundation y registra el `JobEvaluacionTransversalService` que despacha
 * la evaluacion asincrona del intento.
 *
 * Depende de `PrismaModule`. `AuditLogModule`, `IdempotencyModule` y `AiModule`
 * estan registrados como `@Global` en `AppModule` (auditoria y AI) o se
 * inyectan via `PrismaModule` (idempotency).
 */
@Module({
  imports: [PrismaModule],
  controllers: [TransversalController],
  providers: [TransversalService, JobEvaluacionTransversalService],
  exports: [TransversalService, JobEvaluacionTransversalService],
})
export class TransversalModule {}
