import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotificacionesModule } from "../notificaciones/notificaciones.module"
import { CursoDeadlineCron } from "./curso-deadline.cron"
import { CursosController } from "./cursos.controller"
import { CursosService } from "./cursos.service"

/**
 * Modulo de cursos — P4a (CRUD, lifecycle BORRADOR/ARCHIVADO/CERRADO, duplicar,
 * log-cambios). P4b extiende este modulo con la configuracion. P4c agrega la
 * publicacion. P11a anade los endpoints `cerrar` y `deshacer-cierre` +
 * `CursoDeadlineCron` (CURSO_DEADLINE trigger diario).
 *
 * Importa `NotificacionesModule` para emitir `RESULTADO_CIERRE` (P11a) y
 * `CURSO_DEADLINE` desde el cron. `IdempotencyModule` y `AuditLogModule` son
 * `@Global` y no se reimportan aqui.
 */
@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [CursosController],
  providers: [CursosService, CursoDeadlineCron],
  exports: [CursosService],
})
export class CursosModule {}
