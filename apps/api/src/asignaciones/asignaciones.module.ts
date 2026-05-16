import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotificacionesModule } from "../notificaciones/notificaciones.module"
import { PlanPersonalModule } from "../plan-personal/plan-personal.module"
import { AsignacionesNotificacionesService } from "./asignaciones-notificaciones.service"
import { AsignacionesController } from "./asignaciones.controller"
import { AsignacionesService } from "./asignaciones.service"

/**
 * Modulo de asignaciones — Slice 6 P6a (foundation + altas). P6b extiende este
 * modulo con las transiciones de estado; P6c agrega resultado de entrevista
 * cliente + historico expuesto.
 *
 * Importa PrismaModule explicitamente. AuditLogModule esta marcado @Global
 * en `common/audit/audit-log.module.ts`, no se reimporta aqui.
 *
 * P10c: importa `NotificacionesModule` para inyectar `NotificacionesService`
 * en `AsignacionesNotificacionesService` (5 triggers extraidos del god service
 * en la Fase 1.1 del plan de auditoria).
 */
@Module({
  imports: [PrismaModule, PlanPersonalModule, NotificacionesModule],
  controllers: [AsignacionesController],
  providers: [AsignacionesService, AsignacionesNotificacionesService],
  exports: [AsignacionesService],
})
export class AsignacionesModule {}
