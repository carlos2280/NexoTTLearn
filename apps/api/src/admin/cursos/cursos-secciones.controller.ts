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
import {
  type ActualizarSeccionAdminInput,
  type CrearSeccionAdminInput,
  type ReordenarSeccionesAdminInput,
  type SeccionDeleteAdminResponse,
  type SeccionDetalleAdmin,
  type SeccionListAdminResponse,
  actualizarSeccionAdminInputSchema,
  crearSeccionAdminInputSchema,
  reordenarSeccionesAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosSeccionesService } from "./cursos-secciones.service"

@Controller("admin/cursos/:cursoId/modulos/:moduloId/secciones")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosSeccionesController {
  constructor(private readonly seccionesService: CursosSeccionesService) {}

  @Get()
  listar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
  ): Promise<SeccionListAdminResponse> {
    return this.seccionesService.listar(cursoId, moduloId)
  }

  @Get(":seccionId")
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
  ): Promise<SeccionDetalleAdmin> {
    return this.seccionesService.obtenerPorId(cursoId, moduloId, seccionId)
  }

  @Post()
  crear(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(crearSeccionAdminInputSchema)) input: CrearSeccionAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<SeccionDetalleAdmin> {
    return this.seccionesService.crear(cursoId, moduloId, input, requireUsuarioId(usuario))
  }

  @Patch(":seccionId")
  actualizar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Body(new ZodValidationPipe(actualizarSeccionAdminInputSchema))
    input: ActualizarSeccionAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<SeccionDetalleAdmin> {
    return this.seccionesService.actualizar(
      cursoId,
      moduloId,
      seccionId,
      input,
      requireUsuarioId(usuario),
    )
  }

  @Delete(":seccionId")
  @HttpCode(200)
  eliminar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<SeccionDeleteAdminResponse> {
    return this.seccionesService.eliminar(cursoId, moduloId, seccionId, requireUsuarioId(usuario))
  }

  @Post(":seccionId/archivar")
  @HttpCode(200)
  archivar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<SeccionDetalleAdmin> {
    return this.seccionesService.archivar(cursoId, moduloId, seccionId, requireUsuarioId(usuario))
  }

  @Post(":seccionId/desarchivar")
  @HttpCode(200)
  desarchivar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<SeccionDetalleAdmin> {
    return this.seccionesService.desarchivar(
      cursoId,
      moduloId,
      seccionId,
      requireUsuarioId(usuario),
    )
  }

  @Put("reordenar")
  @HttpCode(200)
  reordenar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(reordenarSeccionesAdminInputSchema))
    input: ReordenarSeccionesAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<SeccionListAdminResponse> {
    return this.seccionesService.reordenar(cursoId, moduloId, input, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
