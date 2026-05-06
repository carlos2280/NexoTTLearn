import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { CursosBloquesController } from "./cursos-bloques.controller"
import { CursosBloquesService } from "./cursos-bloques.service"
import { CursosEntrevistaIAController } from "./cursos-entrevista-ia.controller"
import { CursosEntrevistaIAService } from "./cursos-entrevista-ia.service"
import { CursosMiniProyectoController } from "./cursos-miniproyecto.controller"
import { CursosMiniProyectoService } from "./cursos-miniproyecto.service"
import { CursosModulosController } from "./cursos-modulos.controller"
import { CursosModulosService } from "./cursos-modulos.service"
import { CursosProyectoTransversalController } from "./cursos-proyecto-transversal.controller"
import { CursosProyectoTransversalService } from "./cursos-proyecto-transversal.service"
import { CursosSeccionesController } from "./cursos-secciones.controller"
import { CursosSeccionesService } from "./cursos-secciones.service"
import { CursosController } from "./cursos.controller"
import { CursosService } from "./cursos.service"

@Module({
  imports: [PrismaModule],
  controllers: [
    CursosController,
    CursosModulosController,
    CursosSeccionesController,
    CursosBloquesController,
    CursosMiniProyectoController,
    CursosProyectoTransversalController,
    CursosEntrevistaIAController,
  ],
  providers: [
    CursosService,
    CursosModulosService,
    CursosSeccionesService,
    CursosBloquesService,
    CursosMiniProyectoService,
    CursosProyectoTransversalService,
    CursosEntrevistaIAService,
  ],
})
export class CursosModule {}
