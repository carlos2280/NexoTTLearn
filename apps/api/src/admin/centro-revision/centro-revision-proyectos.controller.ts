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
  AjustarEntregaProyectoAdminInput,
  EntregaProyectoDetalleAdmin,
  EntregaProyectoListAdminResponse,
  EvaluarEntregaProyectoAdminInput,
  ListarEntregasProyectoAdminQuery,
} from "@nexott-learn/shared-types"
import {
  ajustarEntregaProyectoAdminInputSchema,
  evaluarEntregaProyectoAdminInputSchema,
  listarEntregasProyectoAdminQuerySchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CentroRevisionProyectosService } from "./centro-revision-proyectos.service"

@Controller()
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CentroRevisionProyectosController {
  constructor(private readonly proyectosService: CentroRevisionProyectosService) {}

  @Get("admin/centro-revision/entregas-proyecto")
  listar(
    @Query(new ZodValidationPipe(listarEntregasProyectoAdminQuerySchema))
    query: ListarEntregasProyectoAdminQuery,
  ): Promise<EntregaProyectoListAdminResponse> {
    return this.proyectosService.listar(query)
  }

  @Get("admin/entregas-proyecto/:id")
  obtener(@Param("id", new ParseUUIDPipe()) id: string): Promise<EntregaProyectoDetalleAdmin> {
    return this.proyectosService.obtener(id)
  }

  @Patch("admin/entregas-proyecto/:id/evaluar")
  @HttpCode(200)
  evaluar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(evaluarEntregaProyectoAdminInputSchema))
    input: EvaluarEntregaProyectoAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntregaProyectoDetalleAdmin> {
    return this.proyectosService.evaluar(id, input, requireUsuarioId(usuario))
  }

  @Patch("admin/entregas-proyecto/:id/ajustar")
  @HttpCode(200)
  ajustar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(ajustarEntregaProyectoAdminInputSchema))
    input: AjustarEntregaProyectoAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntregaProyectoDetalleAdmin> {
    return this.proyectosService.ajustar(id, input, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
