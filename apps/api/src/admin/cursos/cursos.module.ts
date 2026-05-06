import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { CursosBloquesController } from "./cursos-bloques.controller"
import { CursosBloquesService } from "./cursos-bloques.service"
import { CursosModulosController } from "./cursos-modulos.controller"
import { CursosModulosService } from "./cursos-modulos.service"
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
  ],
  providers: [CursosService, CursosModulosService, CursosSeccionesService, CursosBloquesService],
})
export class CursosModule {}
