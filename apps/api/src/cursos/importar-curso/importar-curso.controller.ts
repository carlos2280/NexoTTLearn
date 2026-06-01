import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  type ImportarCursoBody,
  type ImportarCursoResponse,
  importarCursoBodySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"

import { Roles } from "../../common/decorators/roles.decorator"
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe"
import { ImportarCursoService } from "./importar-curso.service"
import { PLANTILLA_CURSO_MD } from "./plantilla-ejemplo"

/**
 * Endpoints del flujo "Importar curso desde Markdown" (D-IMP-1). Solo admins.
 *
 *  - `GET /admin/cursos/importar/plantilla` → texto MD de ejemplo (descarga).
 *  - `POST /admin/cursos/importar` → recibe el MD, parsea, valida y persiste.
 *
 * El controller es delgado: la lógica vive en `ImportarCursoService`.
 */
@Controller("admin/cursos/importar")
export class ImportarCursoController {
  constructor(private readonly importarCursoService: ImportarCursoService) {}

  @Get("plantilla")
  @Roles(RolUsuario.ADMIN)
  @Header("Content-Type", "text/markdown; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="curso-plantilla.md"')
  obtenerPlantilla(): string {
    return PLANTILLA_CURSO_MD
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  // Operación pesada: crea docenas de filas dentro de una transacción.
  // Limitamos a 3 importaciones por minuto por sesión para evitar spam o
  // race-conditions provocadas a propósito.
  @Throttle({ short: { ttl: 60_000, limit: 3 } })
  async importar(
    @Body(new ZodValidationPipe(importarCursoBodySchema)) body: ImportarCursoBody,
  ): Promise<ImportarCursoResponse> {
    return await this.importarCursoService.importar(body)
  }
}
