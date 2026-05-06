import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { RecalculoModule } from "../recalculo/recalculo.module"
import { FichaController } from "./ficha.controller"
import { FichaService } from "./ficha.service"

@Module({
  imports: [PrismaModule, RecalculoModule],
  controllers: [FichaController],
  providers: [FichaService],
})
export class ParticipantesModule {}
