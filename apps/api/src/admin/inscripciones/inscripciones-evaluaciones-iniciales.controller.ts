import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  UseGuards,
} from "@nestjs/common"
import type {
  ActualizarEvaluacionInicialAdminInput,
  EvaluacionInicialDeleteAdminResponse,
  EvaluacionInicialDetalleAdmin,
  EvaluacionInicialListAdminResponse,
  UpsertEvaluacionInicialAdminInput,
} from "@nexott-learn/shared-types"
import {
  actualizarEvaluacionInicialAdminInputSchema,
  upsertEvaluacionInicialAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { InscripcionesEvaluacionesInicialesService } from "./inscripciones-evaluaciones-iniciales.service"

@Controller("admin/inscripciones/:inscripcionId/evaluaciones-iniciales")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class InscripcionesEvaluacionesInicialesController {
  constructor(private readonly evaluacionesService: InscripcionesEvaluacionesInicialesService) {}

  @Get()
  listar(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
  ): Promise<EvaluacionInicialListAdminResponse> {
    return this.evaluacionesService.listar(inscripcionId)
  }

  @Get(":areaId")
  obtener(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("areaId", new ParseUUIDPipe()) areaId: string,
  ): Promise<EvaluacionInicialDetalleAdmin> {
    return this.evaluacionesService.obtener(inscripcionId, areaId)
  }

  @Put(":areaId")
  @HttpCode(200)
  upsert(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("areaId", new ParseUUIDPipe()) areaId: string,
    @Body(new ZodValidationPipe(upsertEvaluacionInicialAdminInputSchema))
    input: UpsertEvaluacionInicialAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EvaluacionInicialDetalleAdmin> {
    return this.evaluacionesService.upsert(inscripcionId, areaId, input, requireUsuarioId(usuario))
  }

  @Patch(":areaId")
  @HttpCode(200)
  actualizar(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("areaId", new ParseUUIDPipe()) areaId: string,
    @Body(new ZodValidationPipe(actualizarEvaluacionInicialAdminInputSchema))
    input: ActualizarEvaluacionInicialAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EvaluacionInicialDetalleAdmin> {
    return this.evaluacionesService.actualizar(
      inscripcionId,
      areaId,
      input,
      requireUsuarioId(usuario),
    )
  }

  @Delete(":areaId")
  @HttpCode(200)
  eliminar(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("areaId", new ParseUUIDPipe()) areaId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EvaluacionInicialDeleteAdminResponse> {
    return this.evaluacionesService.eliminar(inscripcionId, areaId, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
