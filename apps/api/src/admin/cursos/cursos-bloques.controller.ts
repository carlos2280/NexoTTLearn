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
  type ActualizarBloqueAdminInput,
  type BloqueDeleteAdminResponse,
  type BloqueDetalleAdmin,
  type BloqueListAdminResponse,
  type CrearBloqueAdminInput,
  type ReordenarBloquesAdminInput,
  actualizarBloqueAdminInputSchema,
  crearBloqueAdminInputSchema,
  reordenarBloquesAdminInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosBloquesService } from "./cursos-bloques.service"

@Controller("admin/cursos/:cursoId/modulos/:moduloId/secciones/:seccionId/bloques")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosBloquesController {
  constructor(private readonly bloquesService: CursosBloquesService) {}

  @Get()
  listar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
  ): Promise<BloqueListAdminResponse> {
    return this.bloquesService.listar(cursoId, moduloId, seccionId)
  }

  @Get(":bloqueId")
  obtener(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Param("bloqueId", new ParseUUIDPipe()) bloqueId: string,
  ): Promise<BloqueDetalleAdmin> {
    return this.bloquesService.obtenerPorId(cursoId, moduloId, seccionId, bloqueId)
  }

  @Post()
  crear(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Body(new ZodValidationPipe(crearBloqueAdminInputSchema)) input: CrearBloqueAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<BloqueDetalleAdmin> {
    return this.bloquesService.crear(cursoId, moduloId, seccionId, input, requireUsuarioId(usuario))
  }

  @Patch(":bloqueId")
  actualizar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Param("bloqueId", new ParseUUIDPipe()) bloqueId: string,
    @Body(new ZodValidationPipe(actualizarBloqueAdminInputSchema))
    input: ActualizarBloqueAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<BloqueDetalleAdmin> {
    return this.bloquesService.actualizar(
      cursoId,
      moduloId,
      seccionId,
      bloqueId,
      input,
      requireUsuarioId(usuario),
    )
  }

  @Delete(":bloqueId")
  @HttpCode(200)
  eliminar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Param("bloqueId", new ParseUUIDPipe()) bloqueId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<BloqueDeleteAdminResponse> {
    return this.bloquesService.eliminar(
      cursoId,
      moduloId,
      seccionId,
      bloqueId,
      requireUsuarioId(usuario),
    )
  }

  @Post(":bloqueId/archivar")
  @HttpCode(200)
  archivar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Param("bloqueId", new ParseUUIDPipe()) bloqueId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<BloqueDetalleAdmin> {
    return this.bloquesService.archivar(
      cursoId,
      moduloId,
      seccionId,
      bloqueId,
      requireUsuarioId(usuario),
    )
  }

  @Post(":bloqueId/desarchivar")
  @HttpCode(200)
  desarchivar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Param("bloqueId", new ParseUUIDPipe()) bloqueId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<BloqueDetalleAdmin> {
    return this.bloquesService.desarchivar(
      cursoId,
      moduloId,
      seccionId,
      bloqueId,
      requireUsuarioId(usuario),
    )
  }

  @Put("reordenar")
  @HttpCode(200)
  reordenar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("moduloId", new ParseUUIDPipe()) moduloId: string,
    @Param("seccionId", new ParseUUIDPipe()) seccionId: string,
    @Body(new ZodValidationPipe(reordenarBloquesAdminInputSchema))
    input: ReordenarBloquesAdminInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<BloqueListAdminResponse> {
    return this.bloquesService.reordenar(
      cursoId,
      moduloId,
      seccionId,
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
