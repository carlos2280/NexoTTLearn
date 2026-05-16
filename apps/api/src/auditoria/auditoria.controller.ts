import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Res,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  type AuditoriaResumen,
  type ExportarAuditoriaQuery,
  type ListarAuditoriaQuery,
  exportarAuditoriaQuerySchema,
  listarAuditoriaQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, type Prisma, RolUsuario } from "@prisma/client"
import type { Response } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { LIMITE_FILAS_EXPORTACION, exportarAuditoriaACsv } from "./auditoria-export.helpers"
import { AuditoriaService } from "./auditoria.service"

/**
 * `AuditoriaController` — Slice 12 P12 (D-S12-A1..A9).
 *
 * Visor admin de `activity_logs` con dos endpoints:
 *   1. `GET /admin/auditoria`            — lista paginada (no audit, D-CAT-3).
 *   2. `GET /admin/auditoria/exportar`   — CSV throttle 3/min + audit
 *                                         `AUDITORIA_EXPORTADA` con metadata
 *                                         `{filtrosAplicados, totalFilas}`.
 *
 * Auth/autorizacion: SesionGuard + RolesGuard estan registrados como
 * APP_GUARD globales. Aqui se exige `@Roles(ADMIN)` a nivel clase. Cualquier
 * PARTICIPANTE recibe 403 limpio sin tocar el service.
 */
@Controller("admin/auditoria")
@Roles(RolUsuario.ADMIN)
export class AuditoriaController {
  constructor(
    private readonly auditoria: AuditoriaService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  listar(
    @Query(new ZodValidationPipe(listarAuditoriaQuerySchema)) query: ListarAuditoriaQuery,
  ): Promise<Paginated<AuditoriaResumen>> {
    return this.auditoria.listar(query)
  }

  @Get("exportar")
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportar(
    @Query(new ZodValidationPipe(exportarAuditoriaQuerySchema)) query: ExportarAuditoriaQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const total = await this.auditoria.contar(query)
    if (total > LIMITE_FILAS_EXPORTACION) {
      throw new BadRequestException({
        code: apiErrorCodes.filtroDemasiadoAmplio,
        message: "Reduce el rango temporal o anade filtros adicionales.",
      })
    }
    const filas = await this.auditoria.listarTodas(query)
    const csv = exportarAuditoriaACsv(filas)
    const fecha = new Date().toISOString().slice(0, 10)
    response.setHeader("Content-Type", "text/csv; charset=utf-8")
    response.setHeader("Content-Disposition", `attachment; filename="auditoria-${fecha}.csv"`)
    response.end(Buffer.from(csv, "utf-8"))

    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.AUDITORIA_EXPORTADA,
      exito: true,
      recursoTipo: "auditoria",
      metadata: {
        filtrosAplicados: filtrosAuditMetadata(query),
        totalFilas: filas.length,
      } satisfies Prisma.InputJsonObject,
    })
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion no resuelta en controller protegido por SesionGuard",
      })
    }
    return usuario
  }
}

function filtrosAuditMetadata(query: ExportarAuditoriaQuery): Prisma.InputJsonObject {
  const filtros: Record<string, Prisma.InputJsonValue> = {}
  if (query.actorUsuarioId) {
    filtros.actorUsuarioId = query.actorUsuarioId
  }
  if (query.recursoTipo) {
    filtros.recursoTipo = query.recursoTipo
  }
  if (query.recursoId) {
    filtros.recursoId = query.recursoId
  }
  if (query.accion) {
    filtros.accion = query.accion
  }
  if (query.desde) {
    filtros.desde = query.desde
  }
  if (query.hasta) {
    filtros.hasta = query.hasta
  }
  if (query.exito !== undefined) {
    filtros.exito = query.exito
  }
  return filtros
}
