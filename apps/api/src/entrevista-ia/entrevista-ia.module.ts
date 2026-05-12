import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotaSkillModule } from "../nota-skill/nota-skill.module"
import { NotificacionesModule } from "../notificaciones/notificaciones.module"
import { EntrevistaIaController } from "./entrevista-ia.controller"
import { EntrevistaIaService } from "./entrevista-ia.service"

/**
 * Modulo `entrevista-ia` — Slice 8 P8c (9 endpoints E12..E20).
 *
 * Depende de `PrismaModule` y `NotaSkillModule`. `AiModule` esta registrado
 * como `@Global` en `AppModule`. `IdempotencyModule` y `AuditLogModule` son
 * globales y se inyectan transparentemente.
 *
 * S11.5 P11.5a: importa `NotificacionesModule` para inyectar
 * `NotificacionesService` en el trigger `crearIntento`
 * (ENTREVISTA_IA_DISPONIBLE).
 */
@Module({
  imports: [PrismaModule, NotaSkillModule, NotificacionesModule],
  controllers: [EntrevistaIaController],
  providers: [EntrevistaIaService],
  exports: [EntrevistaIaService],
})
export class EntrevistaIaModule {}
