import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { RecalculoModule } from "../recalculo/recalculo.module"
import { SeguimientoController } from "./seguimiento.controller"
import { SeguimientoService } from "./seguimiento.service"

@Module({
  imports: [PrismaModule, RecalculoModule],
  controllers: [SeguimientoController],
  providers: [SeguimientoService],
})
export class SeguimientoModule {}
