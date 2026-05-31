import { Module } from "@nestjs/common"
import { PrismaModule } from "../../common/prisma/prisma.module"
import { ImportarCursoController } from "./importar-curso.controller"
import { ImportarCursoService } from "./importar-curso.service"

/**
 * Módulo del flujo "Importar curso desde Markdown" (D-IMP-1).
 *
 * Vive separado de `CursosModule` porque no comparte controller, ni service,
 * ni dependencias (no necesita NotificacionesModule, AuditLog, etc.). El
 * service usa PrismaService directo en una transacción que crea Curso +
 * Modulo + Seccion + Bloque + CursoModuloHabilitado.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ImportarCursoController],
  providers: [ImportarCursoService],
})
export class ImportarCursoModule {}
