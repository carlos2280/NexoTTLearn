import { Readable } from "node:stream"
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Req,
  StreamableFile,
} from "@nestjs/common"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { SesionUsuario } from "../common/types/sesion.types"
import { ExcelTemplateService } from "./excel-template.service"

@Controller("cursos/:cursoId/evaluacion-inicial")
export class EvaluacionInicialController {
  constructor(
    private readonly templateService: ExcelTemplateService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * D7 — Descarga del template Excel del curso (ADMIN). Genera el workbook con
   * la fila por asignado activo y columnas codificadas para el parser inverso.
   * Audita `EVALUACION_TEMPLATE_DESCARGADO` con metadata estructural.
   */
  @Get("template")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async descargarTemplate(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const sesion = this.requireUsuario(usuario)
    const resultado = await this.templateService.generarTemplate(cursoId)
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.EVALUACION_TEMPLATE_DESCARGADO,
      exito: true,
      recursoTipo: "curso",
      recursoId: cursoId,
      metadata: {
        skillsExigidas: resultado.skillsExigidas,
        areasExigidas: resultado.areasExigidas,
        asignados: resultado.asignados,
      },
      ...extractContextoHttp(req),
    })
    return new StreamableFile(Readable.from(resultado.buffer), {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      disposition: `attachment; filename="eval-inicial-${cursoId}.xlsx"`,
    })
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return usuario
  }
}
