import { Global, Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { StorageService } from "./storage.service"

/**
 * Modulo global de almacenamiento de archivos (D-EVI-1). Patron analogo al
 * AuditLogModule: lo van a consumir varios dominios (evaluacion inicial,
 * entrevistas IA con transcripciones, reportes exportables) sin necesidad de
 * reimportarlo. `STORAGE_ROOT` se resuelve via ConfigService en runtime para
 * permitir backends distintos en dev (FS local) y prod (Railway Volumes).
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
