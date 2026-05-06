import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { RecalculoModule } from "../recalculo/recalculo.module"
import { CentroRevisionBloquesController } from "./centro-revision-bloques.controller"
import { CentroRevisionBloquesService } from "./centro-revision-bloques.service"
import { CentroRevisionProyectosController } from "./centro-revision-proyectos.controller"
import { CentroRevisionProyectosService } from "./centro-revision-proyectos.service"

// Iter 9.A · entregas de bloque (EntregaBloque).
// Iter 9.B · entregas de proyecto (EntregaProyecto · Mini + Transversal).
// Iter 9.9 · recalculo encadenado (RecalculoModule).
@Module({
  imports: [PrismaModule, RecalculoModule],
  controllers: [CentroRevisionBloquesController, CentroRevisionProyectosController],
  providers: [CentroRevisionBloquesService, CentroRevisionProyectosService],
})
export class CentroRevisionModule {}
