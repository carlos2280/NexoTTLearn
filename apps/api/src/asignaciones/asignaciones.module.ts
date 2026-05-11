import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { AsignacionesController } from "./asignaciones.controller"
import { AsignacionesService } from "./asignaciones.service"

/**
 * Modulo de asignaciones — Slice 6 P6a (foundation + altas). P6b extiende este
 * modulo con las transiciones de estado; P6c agrega resultado de entrevista
 * cliente + historico expuesto.
 *
 * Importa PrismaModule explicitamente. AuditLogModule esta marcado @Global
 * en `common/audit/audit-log.module.ts`, no se reimporta aqui.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AsignacionesController],
  providers: [AsignacionesService],
  exports: [AsignacionesService],
})
export class AsignacionesModule {}
