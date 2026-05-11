import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { AplicarService } from "./aplicar.service"
import { EvaluacionInicialController } from "./evaluacion-inicial.controller"
import { ExcelParserService } from "./excel-parser.service"
import { ExcelTemplateService } from "./excel-template.service"
import { HistorialService } from "./historial.service"
import { PreviewService } from "./preview.service"

/**
 * EvaluacionInicialModule — P5a (template) + P5b (preview + parser) + P5c
 * (aplicar idempotente + historial).
 *
 * AuditLogModule / StorageModule / IdempotencyModule son globales: no se
 * reimportan aqui. PrismaModule se importa explicitamente como en el resto
 * de modulos del proyecto.
 *
 * La edicion manual celda a celda (`PATCH /colaboradores/.../ficha/skills/...`)
 * vive en `ColaboradoresModule` con `FichaEdicionService`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluacionInicialController],
  providers: [
    ExcelTemplateService,
    ExcelParserService,
    PreviewService,
    AplicarService,
    HistorialService,
  ],
  exports: [
    ExcelTemplateService,
    ExcelParserService,
    PreviewService,
    AplicarService,
    HistorialService,
  ],
})
export class EvaluacionInicialModule {}
