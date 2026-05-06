import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { InscripcionesEvaluacionesInicialesController } from "./inscripciones-evaluaciones-iniciales.controller"
import { InscripcionesEvaluacionesInicialesService } from "./inscripciones-evaluaciones-iniciales.service"

@Module({
  imports: [PrismaModule],
  controllers: [InscripcionesEvaluacionesInicialesController],
  providers: [InscripcionesEvaluacionesInicialesService],
})
export class InscripcionesModule {}
