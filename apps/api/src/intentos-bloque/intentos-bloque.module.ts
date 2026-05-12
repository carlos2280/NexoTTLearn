import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotaSkillModule } from "../nota-skill/nota-skill.module"
import { IntentosBloqueController } from "./intentos-bloque.controller"
import { IntentosBloqueService } from "./intentos-bloque.service"

/**
 * Modulo `intentos-bloque` — Slice 7 P7b. Expone los 5 endpoints del dominio.
 *
 * FIX-P8-cierre §5.115: importa `NotaSkillModule` para delegar el calculo de
 * `notas_skill.nota_actual` al motor unificado `NotaSkillService.
 * recalcularConFuentes` (D33 70/20/10 + D35). Antes el service computaba el
 * promedio de bloques directo, lo que causaba drift cuando entraban en juego
 * intentos transversales o de entrevista IA.
 *
 * Depende de `PrismaModule` para el cliente Prisma y `NotaSkillModule` para el
 * motor de notas. `AuditLogModule` e `IdempotencyModule` ya estan registrados
 * como `@Global` en el `AppModule`, por lo que el servicio puede inyectarlos
 * sin import explicito.
 */
@Module({
  imports: [PrismaModule, NotaSkillModule],
  controllers: [IntentosBloqueController],
  providers: [IntentosBloqueService],
  exports: [IntentosBloqueService],
})
export class IntentosBloqueModule {}
