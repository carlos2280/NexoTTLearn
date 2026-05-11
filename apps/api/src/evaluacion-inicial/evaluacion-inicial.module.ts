import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { EvaluacionInicialController } from "./evaluacion-inicial.controller"
import { ExcelTemplateService } from "./excel-template.service"

/**
 * EvaluacionInicialModule — P5a (template). P5b anade preview/parser y P5c
 * el aplicar idempotente + edicion manual.
 *
 * AuditLogModule / StorageModule / IdempotencyModule son globales: no se
 * reimportan aqui. PrismaModule se importa explicitamente como en el resto
 * de modulos del proyecto.
 */
@Module({
  imports: [PrismaModule],
  controllers: [EvaluacionInicialController],
  providers: [ExcelTemplateService],
  exports: [ExcelTemplateService],
})
export class EvaluacionInicialModule {}
