import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { CursosController } from "./cursos.controller"
import { CursosService } from "./cursos.service"

/**
 * Modulo de cursos — P4a (CRUD, lifecycle BORRADOR/ARCHIVADO/CERRADO, duplicar,
 * log-cambios). P4b extiende este modulo con la configuracion (areas, skills,
 * modulos, pesos, transversal, entrevista IA). P4c agrega la publicacion.
 *
 * Importa PrismaModule explicitamente. AuditLogModule esta marcado @Global,
 * por lo que no se reimporta aqui.
 */
@Module({
  imports: [PrismaModule],
  controllers: [CursosController],
  providers: [CursosService],
  exports: [CursosService],
})
export class CursosModule {}
