import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { PlanPersonalModule } from "../plan-personal/plan-personal.module"
import { ColaboradoresController } from "./colaboradores.controller"
import { ColaboradoresService } from "./colaboradores.service"
import { FichaEdicionService } from "./ficha/ficha-edicion.service"
import { FichaService } from "./ficha/ficha.service"
import { MeAvanceService } from "./me-avance.service"
import { MeCursosService } from "./me-cursos.service"
import { MeController } from "./me.controller"

/**
 * `ColaboradoresModule`.
 *
 * P11c (DE-P11c-2): incluye `MeAvanceService` para
 * `/me/avance/cursos/:cursoId`. Importa `PlanPersonalModule` para reutilizar
 * `PlanPersonalService.obtenerPorcentajeAvance` (FIX-P11b-avance) y evitar
 * duplicar la regla de seccion completada.
 *
 * FIX-pre-S12: `MeCursosService` para `/me/cursos`. `AuditLogService` se
 * inyecta directamente desde `AuditLogModule` (declarado @Global) para
 * registrar la exportacion RGPD de `/me/ficha/exportar`.
 */
@Module({
  imports: [PrismaModule, PlanPersonalModule],
  controllers: [ColaboradoresController, MeController],
  providers: [
    ColaboradoresService,
    FichaService,
    FichaEdicionService,
    MeAvanceService,
    MeCursosService,
  ],
  exports: [
    ColaboradoresService,
    FichaService,
    FichaEdicionService,
    MeAvanceService,
    MeCursosService,
  ],
})
export class ColaboradoresModule {}
