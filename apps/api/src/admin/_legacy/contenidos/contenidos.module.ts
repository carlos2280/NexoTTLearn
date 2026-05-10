import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { ContenidosController } from "./contenidos.controller"
import { ContenidosService } from "./contenidos.service"

@Module({
  imports: [PrismaModule],
  controllers: [ContenidosController],
  providers: [ContenidosService],
})
export class ContenidosModule {}
