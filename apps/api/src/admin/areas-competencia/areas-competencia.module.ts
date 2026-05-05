import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { AreasCompetenciaController } from "./areas-competencia.controller"
import { AreasCompetenciaService } from "./areas-competencia.service"

@Module({
  imports: [PrismaModule],
  controllers: [AreasCompetenciaController],
  providers: [AreasCompetenciaService],
})
export class AreasCompetenciaModule {}
