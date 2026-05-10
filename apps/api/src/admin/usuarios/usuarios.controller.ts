import {
  BadRequestException,
  Body,
  Controller,
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
  type ActualizarUsuarioInput,
  type BloquearUsuarioInput,
  type CrearUsuarioInput,
  type DesbloquearUsuarioInput,
  type ListarUsuariosQuery,
  type ResetMfaUsuarioInput,
  type ResetPasswordResponse,
  type ResetPasswordUsuarioInput,
  type UsuarioAdmin,
  type UsuarioConCredenciales,
  type UsuarioListResponse,
  activarMfaUsuarioSchema,
  actualizarUsuarioSchema,
  bloquearUsuarioSchema,
  crearUsuarioSchema,
  desbloquearUsuarioSchema,
  listarUsuariosQuerySchema,
  resetMfaUsuarioSchema,
  resetPasswordUsuarioSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { UsuariosService } from "./usuarios.service"

// MAESTRO §2.1, §14.2 · CRUD admin del catálogo de usuarios.
// La agrupación visual `/admin/mantenedores` es solo UI: el back expone
// directamente `/api/admin/usuarios` (mismo patrón que /admin/areas).

@Controller("admin/usuarios")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  listar(
    @Query(new ZodValidationPipe(listarUsuariosQuerySchema)) query: ListarUsuariosQuery,
  ): Promise<UsuarioListResponse> {
    return this.usuariosService.listar(query)
  }

  @Get(":id")
  obtener(@Param("id", new ParseUUIDPipe()) id: string): Promise<UsuarioAdmin> {
    return this.usuariosService.obtenerPorId(id)
  }

  @Post()
  crear(
    @Body(new ZodValidationPipe(crearUsuarioSchema)) input: CrearUsuarioInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<UsuarioConCredenciales> {
    return this.usuariosService.crear(input, requireUsuarioId(usuario))
  }

  @Patch(":id")
  actualizar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(actualizarUsuarioSchema)) input: ActualizarUsuarioInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<UsuarioAdmin> {
    return this.usuariosService.actualizar(id, input, requireUsuarioId(usuario))
  }

  @Post(":id/bloquear")
  @HttpCode(200)
  bloquear(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(bloquearUsuarioSchema)) input: BloquearUsuarioInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<UsuarioAdmin> {
    return this.usuariosService.bloquear(id, input, requireUsuarioId(usuario))
  }

  @Post(":id/desbloquear")
  @HttpCode(200)
  desbloquear(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(desbloquearUsuarioSchema)) input: DesbloquearUsuarioInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<UsuarioAdmin> {
    return this.usuariosService.desbloquear(id, input, requireUsuarioId(usuario))
  }

  @Post(":id/reset-password")
  @HttpCode(200)
  async resetPassword(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(resetPasswordUsuarioSchema)) input: ResetPasswordUsuarioInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<ResetPasswordResponse> {
    const { passwordTemporal } = await this.usuariosService.resetPassword(
      id,
      input,
      requireUsuarioId(usuario),
    )
    // En reset solo devolvemos la temporal: el front ya tiene el usuario
    // en su listado/ficha y lo refresca con el GET si necesita el resto.
    return { passwordTemporal }
  }

  @Post(":id/activar-mfa")
  @HttpCode(200)
  activarMfa(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(activarMfaUsuarioSchema)) _input: unknown,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<UsuarioAdmin> {
    return this.usuariosService.activarMfa(id, requireUsuarioId(usuario))
  }

  @Post(":id/reset-mfa")
  @HttpCode(200)
  resetMfa(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(resetMfaUsuarioSchema)) input: ResetMfaUsuarioInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<UsuarioAdmin> {
    return this.usuariosService.resetMfa(id, input, requireUsuarioId(usuario))
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
