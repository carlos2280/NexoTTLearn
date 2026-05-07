import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { AsignacionesConfirmarLoteService } from "./asignaciones-confirmar-lote.service"
import { AsignacionesCursoController } from "./asignaciones-curso.controller"
import { AsignacionesInscripcionController } from "./asignaciones-inscripcion.controller"
import { AsignacionesInscripcionService } from "./asignaciones-inscripcion.service"
import { AsignacionesMatrizService } from "./asignaciones-matriz.service"
import { DiagnosticoMatrizController } from "./diagnostico-matriz.controller"
import { DiagnosticoMatrizService } from "./diagnostico-matriz.service"
import { HubDiagnosticoController } from "./hub.controller"
import { HubDiagnosticoService } from "./hub.service"

@Module({
  imports: [PrismaModule],
  controllers: [
    DiagnosticoMatrizController,
    AsignacionesCursoController,
    AsignacionesInscripcionController,
    HubDiagnosticoController,
  ],
  providers: [
    DiagnosticoMatrizService,
    AsignacionesMatrizService,
    AsignacionesInscripcionService,
    AsignacionesConfirmarLoteService,
    HubDiagnosticoService,
  ],
})
export class DiagnosticoModule {}
