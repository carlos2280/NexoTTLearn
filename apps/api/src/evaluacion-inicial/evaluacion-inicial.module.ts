import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { EvaluacionInicialController } from "./evaluacion-inicial.controller"
import { ExcelParserService } from "./excel-parser.service"
import { ExcelTemplateService } from "./excel-template.service"
import { PreviewService } from "./preview.service"

/**
 * EvaluacionInicialModule — P5a (template) + P5b (preview + parser).
 *
 * AuditLogModule / StorageModule / IdempotencyModule son globales: no se
 * reimportan aqui. PrismaModule se importa explicitamente como en el resto
 * de modulos del proyecto.
 *
 * P5c anadira el aplicar idempotente, edicion manual y historial.
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluacionInicialController],
  providers: [ExcelTemplateService, ExcelParserService, PreviewService],
  exports: [ExcelTemplateService, ExcelParserService, PreviewService],
})
export class EvaluacionInicialModule {}
