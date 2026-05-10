import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { ModulosController } from "./modulos.controller"
import { ModulosService } from "./modulos.service"

@Module({
  imports: [PrismaModule],
  controllers: [ModulosController],
  providers: [ModulosService],
})
export class ModulosModule {}
