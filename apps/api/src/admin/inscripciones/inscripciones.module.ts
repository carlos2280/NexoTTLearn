import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { InscripcionesCursoController } from "./inscripciones-curso.controller"
import { InscripcionesCursoService } from "./inscripciones-curso.service"
import { InscripcionesEvaluacionesInicialesController } from "./inscripciones-evaluaciones-iniciales.controller"
import { InscripcionesEvaluacionesInicialesService } from "./inscripciones-evaluaciones-iniciales.service"

@Module({
  imports: [PrismaModule],
  controllers: [InscripcionesEvaluacionesInicialesController, InscripcionesCursoController],
  providers: [InscripcionesEvaluacionesInicialesService, InscripcionesCursoService],
})
export class InscripcionesModule {}
