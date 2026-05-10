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
  ActualizarProyectoTransversalAdminInput,
  AjustarPesosProyectoTransversalInput,
  AjustarUmbralProyectoTransversalInput,
  ProyectoTransversalDeleteAdminResponse,
  ProyectoTransversalDetalleAdmin,
  UpsertProyectoTransversalAdminInput,
} from "@nexott-learn/shared-types"
import {
  actualizarProyectoTransversalAdminInputSchema,
  ajustarPesosProyectoTransversalInputSchema,
  ajustarUmbralProyectoTransversalInputSchema,
  upsertProyectoTransversalAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosProyectoTransversalService } from "./cursos-proyecto-transversal.service"

@Controller("admin/cursos/:cursoId/proyecto-transversal")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosProyectoTransversalController {
  constructor(private readonly proyectoTransversalService: CursosProyectoTransversalService) {}

  @Get()
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    return this.proyectoTransversalService.obtener(cursoId)
  }

  @Put()
  @HttpCode(200)
  upsert(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(upsertProyectoTransversalAdminInputSchema))
    input: UpsertProyectoTransversalAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    return this.proyectoTransversalService.upsert(cursoId, input, requireUsuarioId(usuario))
  }

  @Patch()
  @HttpCode(200)
  actualizar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(actualizarProyectoTransversalAdminInputSchema))
    input: ActualizarProyectoTransversalAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    return this.proyectoTransversalService.actualizar(cursoId, input, requireUsuarioId(usuario))
  }

  @Delete()
  @HttpCode(200)
  eliminar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ProyectoTransversalDeleteAdminResponse> {
    return this.proyectoTransversalService.eliminar(cursoId, requireUsuarioId(usuario))
  }

  @Post("pesos")
  @HttpCode(200)
  ajustarPesos(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(ajustarPesosProyectoTransversalInputSchema))
    input: AjustarPesosProyectoTransversalInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    return this.proyectoTransversalService.ajustarPesos(cursoId, input, requireUsuarioId(usuario))
  }

  @Post("umbral")
  @HttpCode(200)
  ajustarUmbral(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(ajustarUmbralProyectoTransversalInputSchema))
    input: AjustarUmbralProyectoTransversalInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ProyectoTransversalDetalleAdmin> {
    return this.proyectoTransversalService.ajustarUmbral(cursoId, input, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
