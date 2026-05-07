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
  AsignacionDeleteResponse,
  AsignacionesInscripcionResponse,
  CambiarTipoAsignacionInput,
  ReemplazarAsignacionesInput,
} from "@nexott-learn/shared-types"
import {
  cambiarTipoAsignacionInputSchema,
  reemplazarAsignacionesInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { AsignacionesInscripcionService } from "./asignaciones-inscripcion.service"

@Controller("admin/inscripciones/:inscripcionId/asignaciones")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class AsignacionesInscripcionController {
  constructor(private readonly service: AsignacionesInscripcionService) {}

  @Get()
  obtener(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
  ): Promise<AsignacionesInscripcionResponse> {
    return this.service.obtener(inscripcionId)
  }

  @Put()
  reemplazar(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Body(new ZodValidationPipe(reemplazarAsignacionesInputSchema))
    input: ReemplazarAsignacionesInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AsignacionesInscripcionResponse> {
    return this.service.reemplazar(inscripcionId, input, requireUsuarioId(usuario))
  }

  @Patch(":moduloId")
  cambiarTipo(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(cambiarTipoAsignacionInputSchema))
    input: CambiarTipoAsignacionInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AsignacionesInscripcionResponse> {
    return this.service.cambiarTipo(inscripcionId, moduloId, input, requireUsuarioId(usuario))
  }

  @Delete(":moduloId")
  @HttpCode(200)
  eliminar(
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AsignacionDeleteResponse> {
    return this.service.eliminar(inscripcionId, moduloId, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
