import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { ReportesModule } from "../reportes/reportes.module"
import { LogsController } from "./logs.controller"
import { LogsService } from "./logs.service"

/**
 * `LogsModule` — Slice futuro B foundation.
 *
 * Expone dos visores admin especificos:
 *   - `GET /admin/logs/cursos`        — `log_cambios_curso`.
 *   - `GET /admin/logs/asignaciones`  — `historico_estados_asignacion`.
 *
 * Importa `ReportesModule` para inyectar `ConsultasLogService` (exportado por
 * Reportes) y registrar cada consulta exitosa en `consultas_logs` con la
 * latencia real del handler.
 */
@Module({
  imports: [PrismaModule, ReportesModule],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
