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
  Post,
  Put,
  UseGuards,
} from "@nestjs/common"
import type {
  ActualizarMiniProyectoAdminInput,
  AjustarPesosMiniProyectoInput,
  AjustarUmbralMiniProyectoInput,
  MiniProyectoDeleteAdminResponse,
  MiniProyectoDetalleAdmin,
  UpsertMiniProyectoAdminInput,
} from "@nexott-learn/shared-types"
import {
  actualizarMiniProyectoAdminInputSchema,
  ajustarPesosMiniProyectoInputSchema,
  ajustarUmbralMiniProyectoInputSchema,
  upsertMiniProyectoAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosMiniProyectoService } from "./cursos-miniproyecto.service"

@Controller("admin/cursos/:cursoId/modulos/:moduloId/miniproyecto")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosMiniProyectoController {
  constructor(private readonly miniProyectoService: CursosMiniProyectoService) {}

  @Get()
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
  ): Promise<MiniProyectoDetalleAdmin> {
    return this.miniProyectoService.obtener(cursoId, moduloId)
  }

  @Put()
  @HttpCode(200)
  upsert(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(upsertMiniProyectoAdminInputSchema))
    input: UpsertMiniProyectoAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<MiniProyectoDetalleAdmin> {
    return this.miniProyectoService.upsert(cursoId, moduloId, input, requireUsuarioId(usuario))
  }

  @Patch()
  @HttpCode(200)
  actualizar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(actualizarMiniProyectoAdminInputSchema))
    input: ActualizarMiniProyectoAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<MiniProyectoDetalleAdmin> {
    return this.miniProyectoService.actualizar(cursoId, moduloId, input, requireUsuarioId(usuario))
  }

  @Delete()
  @HttpCode(200)
  eliminar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<MiniProyectoDeleteAdminResponse> {
    return this.miniProyectoService.eliminar(cursoId, moduloId, requireUsuarioId(usuario))
  }

  @Post("pesos")
  @HttpCode(200)
  ajustarPesos(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(ajustarPesosMiniProyectoInputSchema))
    input: AjustarPesosMiniProyectoInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<MiniProyectoDetalleAdmin> {
    return this.miniProyectoService.ajustarPesos(
      cursoId,
      moduloId,
      input,
      requireUsuarioId(usuario),
    )
  }

  @Post("umbral")
  @HttpCode(200)
  ajustarUmbral(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(ajustarUmbralMiniProyectoInputSchema))
    input: AjustarUmbralMiniProyectoInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<MiniProyectoDetalleAdmin> {
    return this.miniProyectoService.ajustarUmbral(
      cursoId,
      moduloId,
      input,
      requireUsuarioId(usuario),
    )
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
