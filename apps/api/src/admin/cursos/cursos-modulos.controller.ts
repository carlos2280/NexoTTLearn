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
  type ActualizarModuloAdminInput,
  type CrearModuloAdminInput,
  type ModuloDeleteAdminResponse,
  type ModuloDetalleAdmin,
  type ModuloListAdminResponse,
  type ReordenarModulosAdminInput,
  actualizarModuloAdminInputSchema,
  crearModuloAdminInputSchema,
  reordenarModulosAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosModulosService } from "./cursos-modulos.service"

@Controller("admin/cursos/:cursoId/modulos")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosModulosController {
  constructor(private readonly modulosService: CursosModulosService) {}

  @Get()
  listar(@Param("cursoId", new ParseUUIDPipe()) cursoId: string): Promise<ModuloListAdminResponse> {
    return this.modulosService.listar(cursoId)
  }

  @Get(":moduloId")
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
  ): Promise<ModuloDetalleAdmin> {
    return this.modulosService.obtenerPorId(cursoId, moduloId)
  }

  @Post()
  crear(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(crearModuloAdminInputSchema)) input: CrearModuloAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ModuloDetalleAdmin> {
    return this.modulosService.crear(cursoId, input, requireUsuarioId(usuario))
  }

  @Patch(":moduloId")
  actualizar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Body(new ZodValidationPipe(actualizarModuloAdminInputSchema))
    input: ActualizarModuloAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ModuloDetalleAdmin> {
    return this.modulosService.actualizar(cursoId, moduloId, input, requireUsuarioId(usuario))
  }

  @Delete(":moduloId")
  @HttpCode(200)
  eliminar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ModuloDeleteAdminResponse> {
    return this.modulosService.eliminar(cursoId, moduloId, requireUsuarioId(usuario))
  }

  @Post(":moduloId/archivar")
  @HttpCode(200)
  archivar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ModuloDetalleAdmin> {
    return this.modulosService.archivar(cursoId, moduloId, requireUsuarioId(usuario))
  }

  @Post(":moduloId/desarchivar")
  @HttpCode(200)
  desarchivar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ModuloDetalleAdmin> {
    return this.modulosService.desarchivar(cursoId, moduloId, requireUsuarioId(usuario))
  }

  @Put("reordenar")
  @HttpCode(200)
  reordenar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(reordenarModulosAdminInputSchema))
    input: ReordenarModulosAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ModuloListAdminResponse> {
    return this.modulosService.reordenar(cursoId, input, requireUsuarioId(usuario))
  }
}

function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
