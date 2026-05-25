import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { PlanPersonalModule } from "../plan-personal/plan-personal.module"
import { ConsultasLogPurgaCron } from "./consultas-log-purga.cron"
import { ConsultasLogService } from "./consultas-log.service"
import { ReporteCacheCron } from "./reporte-cache.cron"
import { ReporteCacheService } from "./reporte-cache.service"
import { ReportesController } from "./reportes.controller"
import { ReportesService } from "./reportes.service"

/**
 * `ReportesModule` — Slice 11 P11b + P11c.
 *
 * P11b: 4 endpoints operativos (avance-curso, detalle-colaborador,
 * brechas-detectadas, centro-revision).
 * P11c: 4 endpoints estrategicos con cache batch (eficacia-plataforma,
 * historico-cliente, inventario-skills, reutilizacion-catalogo) + audit
 * `consultas_logs`. El autoservicio `/me/avance/cursos/:cursoId` vive en
 * `ColaboradoresModule` (DE-P11c-2: extender MeController existente).
 *
 * ExportService es global (declared @Global() en ExportModule) — no se
 * importa explicitamente.
 */
@Module({
  imports: [PrismaModule, PlanPersonalModule],
  controllers: [ReportesController],
  providers: [
    ReportesService,
    ReporteCacheService,
    ReporteCacheCron,
    ConsultasLogService,
    ConsultasLogPurgaCron,
  ],
  exports: [ReportesService, ReporteCacheService, ConsultasLogService],
})
export class ReportesModule {}
