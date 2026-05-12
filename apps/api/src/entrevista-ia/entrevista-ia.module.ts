import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotaSkillModule } from "../nota-skill/nota-skill.module"
import { EntrevistaIaController } from "./entrevista-ia.controller"
import { EntrevistaIaService } from "./entrevista-ia.service"

/**
 * Modulo `entrevista-ia` — Slice 8 P8c (9 endpoints E12..E20).
 *
 * Depende de `PrismaModule` y `NotaSkillModule`. `AiModule` esta registrado
 * como `@Global` en `AppModule`. `IdempotencyModule` y `AuditLogModule` son
 * globales y se inyectan transparentemente.
 */
@Module({
  imports: [PrismaModule, NotaSkillModule],
  controllers: [EntrevistaIaController],
  providers: [EntrevistaIaService],
  exports: [EntrevistaIaService],
})
export class EntrevistaIaModule {}
