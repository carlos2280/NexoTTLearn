import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { ColaboradoresController } from "./colaboradores.controller"
import { ColaboradoresService } from "./colaboradores.service"
import { FichaService } from "./ficha/ficha.service"
import { MeController } from "./me.controller"

@Module({
  imports: [PrismaModule],
  controllers: [ColaboradoresController, MeController],
  providers: [ColaboradoresService, FichaService],
  exports: [ColaboradoresService, FichaService],
})
export class ColaboradoresModule {}
