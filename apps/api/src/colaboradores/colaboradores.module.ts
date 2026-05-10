import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { ColaboradoresController } from "./colaboradores.controller"
import { ColaboradoresService } from "./colaboradores.service"

@Module({
  imports: [PrismaModule],
  controllers: [ColaboradoresController],
  providers: [ColaboradoresService],
  exports: [ColaboradoresService],
})
export class ColaboradoresModule {}
