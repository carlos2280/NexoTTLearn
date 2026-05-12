import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { PlanPersonalModule } from "../plan-personal/plan-personal.module"
import { ReportesController } from "./reportes.controller"
import { ReportesService } from "./reportes.service"

/**
 * `ReportesModule` — Slice 11 P11b.
 *
 * Solo expone los 4 endpoints operativos. Los estrategicos + autoservicio +
 * export entran en P11c. Las dependencias se mantienen al minimo: PrismaModule
 * + lo que el controller necesita por convencion (guards globales ya
 * registrados en `app.module.ts`).
 *
 * FIX-P11b-avance: importa `PlanPersonalModule` para resolver
 * `PlanPersonalService.obtenerPorcentajeAvance` desde `avanceCursoActual`
 * (§5.128 — cablear el porcentaje real en lugar de 0 hardcodeado).
 */
@Module({
  imports: [PrismaModule, PlanPersonalModule],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
