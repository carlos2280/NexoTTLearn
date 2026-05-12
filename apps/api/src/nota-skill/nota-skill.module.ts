import { Module } from "@nestjs/common"
import { NotaSkillService } from "./nota-skill.service"

/**
 * `NotaSkillModule` — motor centralizado D33 (Slice 8 P8b — D-S8-F2).
 *
 * Stateless: el service recibe el `tx`/PrismaClient via parametro, sin
 * inyectar PrismaService. Importado por `TransversalModule` (y P8c por
 * `EntrevistaIaModule`). El motor de bloques actual no se refactoriza en
 * P8b para evitar regresion; lo consolida FIX-P8-cierre.
 */
@Module({
  providers: [NotaSkillService],
  exports: [NotaSkillService],
})
export class NotaSkillModule {}
