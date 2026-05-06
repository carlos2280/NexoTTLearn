import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { CentroRevisionBloquesController } from "./centro-revision-bloques.controller"
import { CentroRevisionBloquesService } from "./centro-revision-bloques.service"
import { CentroRevisionProyectosController } from "./centro-revision-proyectos.controller"
import { CentroRevisionProyectosService } from "./centro-revision-proyectos.service"

// Iter 9.A · entregas de bloque (EntregaBloque).
// Iter 9.B · entregas de proyecto (EntregaProyecto · Mini + Transversal).
@Module({
  imports: [PrismaModule],
  controllers: [CentroRevisionBloquesController, CentroRevisionProyectosController],
  providers: [CentroRevisionBloquesService, CentroRevisionProyectosService],
})
export class CentroRevisionModule {}
