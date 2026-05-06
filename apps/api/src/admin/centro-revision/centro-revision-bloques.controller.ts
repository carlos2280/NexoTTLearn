import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common"
import type {
  AjustarEntregaBloqueAdminInput,
  EntregaBloqueDetalleAdmin,
  EntregaBloqueListAdminResponse,
  EvaluarEntregaBloqueAdminInput,
  ListarEntregasBloqueAdminQuery,
} from "@nexott-learn/shared-types"
import {
  ajustarEntregaBloqueAdminInputSchema,
  evaluarEntregaBloqueAdminInputSchema,
  listarEntregasBloqueAdminQuerySchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CentroRevisionBloquesService } from "./centro-revision-bloques.service"

@Controller()
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CentroRevisionBloquesController {
  constructor(private readonly entregasService: CentroRevisionBloquesService) {}

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/centro-revision/entregas-bloque
  // Cola filtrable (default: solo PENDIENTE_REVISION).
  // ──────────────────────────────────────────────────────────────────

  @Get("admin/centro-revision/entregas-bloque")
  listar(
    @Query(new ZodValidationPipe(listarEntregasBloqueAdminQuerySchema))
    query: ListarEntregasBloqueAdminQuery,
  ): Promise<EntregaBloqueListAdminResponse> {
    return this.entregasService.listar(query)
  }

  // ──────────────────────────────────────────────────────────────────
  // GET /admin/entregas-bloque/:id
  // Detalle + intentos previos del mismo (participante, bloque).
  // ──────────────────────────────────────────────────────────────────

  @Get("admin/entregas-bloque/:id")
  obtener(@Param("id", new ParseUUIDPipe()) id: string): Promise<EntregaBloqueDetalleAdmin> {
    return this.entregasService.obtener(id)
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH /admin/entregas-bloque/:id/evaluar
  // PENDIENTE_REVISION → EVALUADA. ajustadaManual=false.
  // ──────────────────────────────────────────────────────────────────

  @Patch("admin/entregas-bloque/:id/evaluar")
  @HttpCode(200)
  evaluar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(evaluarEntregaBloqueAdminInputSchema))
    input: EvaluarEntregaBloqueAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntregaBloqueDetalleAdmin> {
    return this.entregasService.evaluar(id, input, requireUsuarioId(usuario))
  }

  // ──────────────────────────────────────────────────────────────────
  // PATCH /admin/entregas-bloque/:id/ajustar
  // EVALUADA o EVALUADA_AUTOMATICAMENTE → EVALUADA con ajustadaManual=true.
  // MAESTRO §A26 · motivo OBLIGATORIO.
  // ──────────────────────────────────────────────────────────────────

  @Patch("admin/entregas-bloque/:id/ajustar")
  @HttpCode(200)
  ajustar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ajustarEntregaBloqueAdminInputSchema))
    input: AjustarEntregaBloqueAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntregaBloqueDetalleAdmin> {
    return this.entregasService.ajustar(id, input, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
