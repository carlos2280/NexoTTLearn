import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotificacionesModule } from "../notificaciones/notificaciones.module"
import { AreasController } from "./areas/areas.controller"
import { AreasService } from "./areas/areas.service"
import { BloquesController } from "./bloques/bloques.controller"
import { BloquesService } from "./bloques/bloques.service"
import { ClientesController } from "./clientes/clientes.controller"
import { ClientesService } from "./clientes/clientes.service"
import { ModulosController } from "./modulos/modulos.controller"
import { ModulosService } from "./modulos/modulos.service"
import { SeccionesController } from "./secciones/secciones.controller"
import { SeccionesService } from "./secciones/secciones.service"
import { SkillsController } from "./skills/skills.controller"
import { SkillsService } from "./skills/skills.service"

/**
 * Modulo unico del catalogo formativo (D-CAT-1).
 *
 * Agrupa los 6 recursos de lectura: Area > Skill > Modulo > Seccion > Bloque
 * y Cliente. Todos los services se exportan para que P3 los reutilice al
 * validar referencias en mutaciones.
 */
@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [
    AreasController,
    SkillsController,
    ModulosController,
    SeccionesController,
    BloquesController,
    ClientesController,
  ],
  providers: [
    AreasService,
    SkillsService,
    ModulosService,
    SeccionesService,
    BloquesService,
    ClientesService,
  ],
  exports: [
    AreasService,
    SkillsService,
    ModulosService,
    SeccionesService,
    BloquesService,
    ClientesService,
  ],
})
export class CatalogoModule {}
