import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotaSkillModule } from "../nota-skill/nota-skill.module"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import { TransversalController } from "./transversal.controller"
import { TransversalService } from "./transversal.service"

/**
 * Modulo `transversal` — Slice 8 P8a + P8b. P8b suma 5 endpoints (capas,
 * finalizar, anular) y conecta el motor `NotaSkillService` (D33) para
 * replicar la nota global a las skills etiquetadas con histórico.
 *
 * Depende de `PrismaModule` y `NotaSkillModule`. `AuditLogModule`,
 * `IdempotencyModule` y `AiModule` estan registrados como `@Global` en
 * `AppModule` o se inyectan via `PrismaModule` (idempotency).
 */
@Module({
  imports: [PrismaModule, NotaSkillModule],
  controllers: [TransversalController],
  providers: [TransversalService, JobEvaluacionTransversalService],
  exports: [TransversalService, JobEvaluacionTransversalService],
})
export class TransversalModule {}
