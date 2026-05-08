import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { RecalculoModule } from "../recalculo/recalculo.module"
import { CeldaEvolucionService } from "./celda-evolucion.service"
import { SeguimientoController } from "./seguimiento.controller"
import { SeguimientoService } from "./seguimiento.service"

@Module({
  imports: [PrismaModule, RecalculoModule],
  controllers: [SeguimientoController],
  providers: [SeguimientoService, CeldaEvolucionService],
})
export class SeguimientoModule {}
