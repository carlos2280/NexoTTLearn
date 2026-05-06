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
  Query,
  UseGuards,
} from "@nestjs/common"
import {
  type ActualizarAreaInput,
  type AreaConContadores,
  type AreaDeleteResponse,
  type AreaListResponse,
  type CrearAreaInput,
  type ListarAreasQuery,
  actualizarAreaSchema,
  crearAreaSchema,
  listarAreasQuerySchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { AreasService } from "./areas.service"

// MAESTRO §14.3 · CRUD admin del catálogo global de áreas.
// La agrupación visual `/admin/mantenedores` es solo UI: el back expone
// directamente `/api/admin/areas`.

@Controller("admin/areas")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  listar(
    @Query(new ZodValidationPipe(listarAreasQuerySchema)) query: ListarAreasQuery,
  ): Promise<AreaListResponse> {
    return this.areasService.listar(query)
  }

  @Get(":id")
  obtener(@Param("id", new ParseUUIDPipe()) id: string): Promise<AreaConContadores> {
    return this.areasService.obtenerPorId(id)
  }

  @Post()
  crear(
    @Body(new ZodValidationPipe(crearAreaSchema)) input: CrearAreaInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AreaConContadores> {
    return this.areasService.crear(input, requireUsuarioId(usuario))
  }

  @Patch(":id")
  actualizar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(actualizarAreaSchema)) input: ActualizarAreaInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AreaConContadores> {
    // El schema `.strict()` ya rechaza `estado` con 400 antes de llegar aquí.
    // La transición ACTIVA↔OBSOLETA va por DELETE y POST /restaurar.
    return this.areasService.actualizar(id, input, requireUsuarioId(usuario))
  }

  @Delete(":id")
  eliminar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AreaDeleteResponse> {
    return this.areasService.eliminar(id, requireUsuarioId(usuario))
  }

  @Post(":id/restaurar")
  @HttpCode(200)
  restaurar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<AreaConContadores> {
    return this.areasService.restaurar(id, requireUsuarioId(usuario))
  }
}

// SesionGuard ya garantiza que `request.user` existe; este check actúa de
// type-narrow para el resto del controller sin convertir el tipo a `any`.
function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
