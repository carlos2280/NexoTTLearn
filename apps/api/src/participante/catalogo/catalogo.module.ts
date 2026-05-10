import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { CatalogoController } from "./catalogo.controller"
import { CatalogoInscribirService } from "./catalogo.inscribir.service"
import { CatalogoService } from "./catalogo.service"

@Module({
  imports: [PrismaModule],
  controllers: [CatalogoController],
  providers: [CatalogoService, CatalogoInscribirService],
})
export class CatalogoModule {}
