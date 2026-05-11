import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { PlanPersonalController } from "./plan-personal.controller"
import { PlanPersonalService } from "./plan-personal.service"

/**
 * Modulo plan personal — Slice 7 P7a. Expone los 3 endpoints de lectura +
 * calculo + recalculo. El service `PlanPersonalService` se exporta para que
 * `AsignacionesModule` pueda inyectarlo y cerrar los TODO(S7) de Slice 6
 * (D-S7-B4: calcular plan en creacion y conversion a asignado).
 */
@Module({
  imports: [PrismaModule],
  controllers: [PlanPersonalController],
  providers: [PlanPersonalService],
  exports: [PlanPersonalService],
})
export class PlanPersonalModule {}
