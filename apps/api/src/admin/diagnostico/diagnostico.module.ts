import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { AsignacionesConfirmarLoteService } from "./asignaciones-confirmar-lote.service"
import { AsignacionesCursoController } from "./asignaciones-curso.controller"
import { AsignacionesInscripcionController } from "./asignaciones-inscripcion.controller"
import { AsignacionesInscripcionService } from "./asignaciones-inscripcion.service"
import { AsignacionesMatrizService } from "./asignaciones-matriz.service"
import { DiagnosticoMatrizController } from "./diagnostico-matriz.controller"
import { DiagnosticoMatrizService } from "./diagnostico-matriz.service"
import { ExcelConfirmarService } from "./excel-confirmar.service"
import { ExcelDiagnosticoController } from "./excel-diagnostico.controller"
import { ExcelPlantillaService } from "./excel-plantilla.service"
import { ExcelPreviewService } from "./excel-preview.service"
import { ExcelUploadCacheService } from "./excel-upload-cache.service"
import { HubDiagnosticoController } from "./hub.controller"
import { HubDiagnosticoService } from "./hub.service"

@Module({
  imports: [PrismaModule],
  controllers: [
    DiagnosticoMatrizController,
    AsignacionesCursoController,
    AsignacionesInscripcionController,
    HubDiagnosticoController,
    ExcelDiagnosticoController,
  ],
  providers: [
    DiagnosticoMatrizService,
    AsignacionesMatrizService,
    AsignacionesInscripcionService,
    AsignacionesConfirmarLoteService,
    HubDiagnosticoService,
    ExcelUploadCacheService,
    ExcelPlantillaService,
    ExcelPreviewService,
    ExcelConfirmarService,
  ],
})
export class DiagnosticoModule {}
