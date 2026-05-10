import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import type {
  ConfirmarLoteInput,
  ConfirmarLoteResponse,
  MatrizAsignacionesQuery,
  MatrizAsignacionesResponse,
} from "@nexott-learn/shared-types"
import { confirmarLoteInputSchema, matrizAsignacionesQuerySchema } from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { AsignacionesConfirmarLoteService } from "./asignaciones-confirmar-lote.service"
import { AsignacionesMatrizService } from "./asignaciones-matriz.service"

@Controller("admin/cursos/:cursoId/diagnostico/asignaciones")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class AsignacionesCursoController {
  constructor(
    private readonly matrizService: AsignacionesMatrizService,
    private readonly confirmarLoteService: AsignacionesConfirmarLoteService,
  ) {}

  @Get()
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Query(new ZodValidationPipe(matrizAsignacionesQuerySchema))
    query: MatrizAsignacionesQuery,
  ): Promise<MatrizAsignacionesResponse> {
    return this.matrizService.obtenerMatriz(cursoId, query)
  }

  @Post("confirmar-lote")
  @HttpCode(200)
  confirmarLote(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(confirmarLoteInputSchema)) input: ConfirmarLoteInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ConfirmarLoteResponse> {
    return this.confirmarLoteService.confirmar(cursoId, input, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
