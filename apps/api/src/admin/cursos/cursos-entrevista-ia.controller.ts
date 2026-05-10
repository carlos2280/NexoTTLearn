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
  ActualizarEntrevistaIAAdminInput,
  EntrevistaIADeleteAdminResponse,
  EntrevistaIADetalleAdmin,
  UpsertEntrevistaIAAdminInput,
} from "@nexott-learn/shared-types"
import {
  actualizarEntrevistaIAAdminInputSchema,
  upsertEntrevistaIAAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosEntrevistaIAService } from "./cursos-entrevista-ia.service"

@Controller("admin/cursos/:cursoId/entrevista-ia")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosEntrevistaIAController {
  constructor(private readonly entrevistaIAService: CursosEntrevistaIAService) {}

  @Get()
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
  ): Promise<EntrevistaIADetalleAdmin> {
    return this.entrevistaIAService.obtener(cursoId)
  }

  @Put()
  @HttpCode(200)
  upsert(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(upsertEntrevistaIAAdminInputSchema))
    input: UpsertEntrevistaIAAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntrevistaIADetalleAdmin> {
    return this.entrevistaIAService.upsert(cursoId, input, requireUsuarioId(usuario))
  }

  @Patch()
  @HttpCode(200)
  actualizar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(actualizarEntrevistaIAAdminInputSchema))
    input: ActualizarEntrevistaIAAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntrevistaIADetalleAdmin> {
    return this.entrevistaIAService.actualizar(cursoId, input, requireUsuarioId(usuario))
  }

  @Delete()
  @HttpCode(200)
  eliminar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<EntrevistaIADeleteAdminResponse> {
    return this.entrevistaIAService.eliminar(cursoId, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
