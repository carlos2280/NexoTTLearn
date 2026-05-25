import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  ColaboradorAdminResumen,
  CrearColaboradorInput,
  EntradaHistoricoNotaSkill,
  ExportarColaboradoresQuery,
  FichaResponse,
  ListarColaboradoresQuery,
  PaginacionQuery,
  Paginated,
  PatchSkillRequest,
  PatchSkillResponse,
  crearColaboradorSchema,
  exportarColaboradoresQuerySchema,
  listarColaboradoresQuerySchema,
  paginacionQuerySchema,
  patchSkillRequestSchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, type Prisma, RolUsuario } from "@prisma/client"
import { Request, Response } from "express"
import { LIMITE_FILAS_EXPORTACION } from "../auditoria/auditoria-export.helpers"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ExportService } from "../common/export/export.service"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import {
  COLUMNAS_COLABORADORES_EXPORT,
  aplanarColaboradorParaExport,
  nombreArchivoExportColaboradores,
} from "./colaboradores-export.helpers"
import { ColaboradoresService } from "./colaboradores.service"
import { AltaColaboradorResponse } from "./colaboradores.types"
import { FichaEdicionService } from "./ficha/ficha-edicion.service"
import { FichaService } from "./ficha/ficha.service"

@Controller("colaboradores")
export class ColaboradoresController {
  constructor(
    private readonly colaboradoresService: ColaboradoresService,
    private readonly fichaService: FichaService,
    private readonly fichaEdicionService: FichaEdicionService,
    private readonly auditLog: AuditLogService,
    private readonly exportService: ExportService,
  ) {}

  @Get()
  @Roles(RolUsuario.ADMIN)
  async listar(
    @Query(new ZodValidationPipe(listarColaboradoresQuerySchema)) query: ListarColaboradoresQuery,
  ): Promise<Paginated<ColaboradorAdminResumen>> {
    return await this.colaboradoresService.listar(query)
  }

  @Get("exportar")
  @Roles(RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async exportar(
    @Query(new ZodValidationPipe(exportarColaboradoresQuerySchema))
    query: ExportarColaboradoresQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sesion = this.requireUsuario(usuario)
    const total = await this.colaboradoresService.contar(query)
    if (total > LIMITE_FILAS_EXPORTACION) {
      throw new BadRequestException({
        code: apiErrorCodes.errorInterno,
        message: "El filtro produce demasiados resultados. Reduce el alcance y reintenta.",
      })
    }
    const colaboradores = await this.colaboradoresService.listarTodosParaExport(query)
    const filas = colaboradores.map(aplanarColaboradorParaExport)
    const result =
      query.formato === "xlsx"
        ? await this.exportService.aXlsx(filas, COLUMNAS_COLABORADORES_EXPORT, "colaboradores")
        : await this.exportService.aCsv(filas, COLUMNAS_COLABORADORES_EXPORT)

    response.setHeader("Content-Type", result.mime)
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivoExportColaboradores(query.formato)}"`,
    )
    response.send(result.buffer)

    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.LOGS_EXPORTADO,
      exito: true,
      recursoTipo: "colaboradores",
      metadata: {
        formato: query.formato,
        totalFilas: total,
        filtrosAplicados: filtrosExportMetadata(query),
      } satisfies Prisma.InputJsonObject,
    })
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearColaboradorSchema)) input: CrearColaboradorInput,
    @CurrentUser() admin: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AltaColaboradorResponse> {
    return await this.colaboradoresService.crear(
      input,
      this.requireUsuario(admin).usuarioId,
      extractContextoHttp(req),
    )
  }

  @Get(":colaboradorId/ficha")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtenerFicha(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<FichaResponse> {
    return await this.fichaService.obtenerFicha(colaboradorId, this.requireUsuario(usuario))
  }

  /**
   * Edicion manual celda a celda (§7.5, D-EVI-11). El `origen` se asigna
   * server-side a `MANUAL`; el body solo lleva `valor`. `X-Motivo` obligatorio
   * via `@RequiereMotivo()` (MotivoGuard global lo valida; saneamiento Zod en
   * `extractMotivo`). Audit log `NOTA_SKILL_EDITADA_MANUALMENTE` desde el
   * controller (D-AUDIT-2) con metadata estructural (incluye `valorAnterior`
   * y `valorNuevo`).
   */
  @Patch(":colaboradorId/ficha/skills/:skillId")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async editarSkill(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @Param("skillId", ParseUUIDPipe) skillId: string,
    @Body(new ZodValidationPipe(patchSkillRequestSchema)) body: PatchSkillRequest,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<PatchSkillResponse> {
    const sesion = this.requireUsuario(usuario)
    // MotivoGuard ya rechazo el caso ausente (422). Defensa estatica adicional
    // para TS: el guard garantiza que `motivo` esta presente y validado.
    if (!motivo) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Motivo ausente tras pasar MotivoGuard.",
      })
    }
    const resultado = await this.fichaEdicionService.editarSkill({
      colaboradorId,
      skillId,
      valor: body.valor,
      motivo,
      usuarioId: sesion.usuarioId,
    })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.NOTA_SKILL_EDITADA_MANUALMENTE,
      exito: true,
      recursoTipo: "colaborador",
      recursoId: colaboradorId,
      metadata: {
        skillId,
        valorAnterior: resultado.valorAnterior,
        valorNuevo: body.valor,
        motivo,
      },
      ...extractContextoHttp(req),
    })
    return resultado.response
  }

  @Get(":colaboradorId/ficha/skills/:skillId/historico")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async historicoSkill(
    @Param("colaboradorId", ParseUUIDPipe) colaboradorId: string,
    @Param("skillId", ParseUUIDPipe) skillId: string,
    @Query(new ZodValidationPipe(paginacionQuerySchema)) query: PaginacionQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<EntradaHistoricoNotaSkill>> {
    return await this.fichaService.listarHistoricoSkill(
      colaboradorId,
      skillId,
      query,
      this.requireUsuario(usuario),
    )
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

function filtrosExportMetadata(query: ExportarColaboradoresQuery): Prisma.InputJsonObject {
  const filtros: Record<string, Prisma.InputJsonValue> = {}
  if (query.q) {
    filtros.q = query.q
  }
  if (query.rol) {
    filtros.rol = query.rol
  }
  if (query.estadoEmpleado) {
    filtros.estadoEmpleado = query.estadoEmpleado
  }
  if (query.bloqueado !== undefined) {
    filtros.bloqueado = query.bloqueado
  }
  return filtros
}
