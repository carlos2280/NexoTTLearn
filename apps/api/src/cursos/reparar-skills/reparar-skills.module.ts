import { Module } from "@nestjs/common"

import { PrismaModule } from "../../common/prisma/prisma.module"
import { PlanPersonalModule } from "../../plan-personal/plan-personal.module"
import { RepararSkillsCursoController } from "./reparar-skills.controller"
import { RepararSkillsCursoService } from "./reparar-skills.service"

/**
 * "Reparar skills de un curso ya cargado". Aparte de `CursosModule` porque
 * depende del recalculo de planes (`PlanPersonalModule`) y no comparte nada
 * mas con el CRUD de cursos. AuditLog es @Global.
 */
@Module({
  imports: [PrismaModule, PlanPersonalModule],
  controllers: [RepararSkillsCursoController],
  providers: [RepararSkillsCursoService],
})
export class RepararSkillsCursoModule {}
