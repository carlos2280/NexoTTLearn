import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotificacionesModule } from "../notificaciones/notificaciones.module"
import { PlanPersonalRecalculoService } from "./plan-personal-recalculo.service"
import { PlanPersonalController } from "./plan-personal.controller"
import { PlanPersonalService } from "./plan-personal.service"

/**
 * Modulo plan personal — Slice 7 P7a. Expone los 3 endpoints de lectura +
 * calculo + recalculo. El service `PlanPersonalService` se exporta para que
 * `AsignacionesModule` pueda inyectarlo y cerrar los TODO(S7) de Slice 6
 * (D-S7-B4: calcular plan en creacion y conversion a asignado).
 *
 * P10c: importa `NotificacionesModule` para inyectar `NotificacionesService`
 * en los triggers `calcularExplicito`, `recalcular` y `ajustarPlan`.
 *
 * Fase 1.1 split: `PlanPersonalRecalculoService` aisla el recalculo batch
 * (endpoint /cursos/:cursoId/planes/recalcular-masivo) y delega los
 * recalculos individuales en `PlanPersonalService.recalcular`. Solo lo usa
 * el controller — no se exporta del modulo.
 */
@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [PlanPersonalController],
  providers: [PlanPersonalService, PlanPersonalRecalculoService],
  exports: [PlanPersonalService],
})
export class PlanPersonalModule {}
