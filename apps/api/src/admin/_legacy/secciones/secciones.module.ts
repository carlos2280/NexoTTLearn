import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { SeccionesController } from "./secciones.controller"
import { SeccionesService } from "./secciones.service"

@Module({
  imports: [PrismaModule],
  controllers: [SeccionesController],
  providers: [SeccionesService],
})
export class SeccionesModule {}
