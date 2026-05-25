import { Module } from "@nestjs/common"
import { PrismaModule } from "../common/prisma/prisma.module"
import { NotaSkillModule } from "../nota-skill/nota-skill.module"
import { CodigoEvaluadorService } from "./codigo-evaluador.service"
import { IntentosBloqueController } from "./intentos-bloque.controller"
import { IntentosBloqueService } from "./intentos-bloque.service"

/**
 * Modulo `intentos-bloque` — Slice 7 P7b + auto-correccion CODIGO_PREGUNTAS.
 *
 * La ejecucion del codigo del participante ocurre en el navegador (Pyodide
 * para Python, Web Worker para JS/TS). El `CodigoEvaluadorService` no ejecuta
 * codigo: valida que los resultados reportados por el cliente cubran todos
 * los `testId` del bloque `CODIGO_TESTS` hermano y recalcula la nota a partir
 * de cuantos tests pasaron (nunca confia en una nota agregada del cliente).
 */
@Module({
  imports: [PrismaModule, NotaSkillModule],
  controllers: [IntentosBloqueController],
  providers: [IntentosBloqueService, CodigoEvaluadorService],
  exports: [IntentosBloqueService],
})
export class IntentosBloqueModule {}
