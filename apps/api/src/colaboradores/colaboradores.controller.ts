import {
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
} from "@nestjs/common"
import {
  ColaboradorAdminResumen,
  CrearColaboradorInput,
  EntradaHistoricoNotaSkill,
  FichaResponse,
  ListarColaboradoresQuery,
  PaginacionQuery,
  Paginated,
  PatchSkillRequest,
  PatchSkillResponse,
  crearColaboradorSchema,
  listarColaboradoresQuerySchema,
  paginacionQuerySchema,
  patchSkillRequestSchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
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
  ) {}

  @Get()
  @Roles(RolUsuario.ADMIN)
  async listar(
    @Query(new ZodValidationPipe(listarColaboradoresQuerySchema)) query: ListarColaboradoresQuery,
  ): Promise<Paginated<ColaboradorAdminResumen>> {
    return await this.colaboradoresService.listar(query)
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
