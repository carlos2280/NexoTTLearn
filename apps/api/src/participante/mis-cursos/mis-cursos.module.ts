import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { MisCursosController } from "./mis-cursos.controller"
import { MisCursosService } from "./mis-cursos.service"

@Module({
  imports: [PrismaModule],
  controllers: [MisCursosController],
  providers: [MisCursosService],
})
export class MisCursosModule {}
