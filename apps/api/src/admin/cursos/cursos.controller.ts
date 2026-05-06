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
  Query,
  UseGuards,
} from "@nestjs/common"
import {
  type ActualizarCursoAreaInput,
  type ActualizarCursoAreasInput,
  type ActualizarCursoInput,
  type AgregarCursoAreaInput,
  type CrearCursoInput,
  type CursoAreaIndividualDetalle,
  type CursoAreaMutacionResponse,
  type CursoDeleteResponse,
  type CursoDetalle,
  type CursoListResponse,
  type ListarCursosQuery,
  type PublicarResponse,
  type ReemplazarCursoAreaInput,
  type TransicionEstadoCursoInput,
  actualizarCursoAreaInputSchema,
  actualizarCursoAreasInputSchema,
  actualizarCursoInputSchema,
  agregarCursoAreaInputSchema,
  crearCursoInputSchema,
  listarCursosQuerySchema,
  reemplazarCursoAreaInputSchema,
  transicionEstadoCursoInputSchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { CursosService } from "./cursos.service"

// MAESTRO §5, §6 · CRUD admin del curso (schema v2). Iter 1 backend.
//
// Todas las rutas requieren rol ADMIN (RBAC vive en SesionGuard + RolGuard).

@Controller("admin/cursos")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  listar(
    @Query(new ZodValidationPipe(listarCursosQuerySchema)) query: ListarCursosQuery,
  ): Promise<CursoListResponse> {
    return this.cursosService.listar(query)
  }

  @Get(":id")
  obtener(@Param("id", new ParseUUIDPipe()) id: string): Promise<CursoDetalle> {
    return this.cursosService.obtenerPorId(id)
  }

  @Post()
  crear(
    @Body(new ZodValidationPipe(crearCursoInputSchema)) input: CrearCursoInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoDetalle> {
    return this.cursosService.crear(input, requireUsuarioId(usuario))
  }

  @Patch(":id")
  actualizar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(actualizarCursoInputSchema)) input: ActualizarCursoInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoDetalle> {
    return this.cursosService.actualizar(id, input, requireUsuarioId(usuario))
  }

  @Put(":id/areas")
  actualizarAreas(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(actualizarCursoAreasInputSchema))
    input: ActualizarCursoAreasInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoDetalle> {
    return this.cursosService.actualizarAreas(id, input, requireUsuarioId(usuario))
  }

  @Post(":id/publicar")
  @HttpCode(200)
  publicar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<PublicarResponse> {
    return this.cursosService.publicar(id, requireUsuarioId(usuario))
  }

  @Post(":id/despublicar")
  @HttpCode(200)
  despublicar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(transicionEstadoCursoInputSchema))
    input: TransicionEstadoCursoInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoDetalle> {
    return this.cursosService.despublicar(id, input, requireUsuarioId(usuario))
  }

  @Post(":id/cerrar")
  @HttpCode(200)
  cerrar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(transicionEstadoCursoInputSchema))
    input: TransicionEstadoCursoInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoDetalle> {
    return this.cursosService.cerrar(id, input, requireUsuarioId(usuario))
  }

  @Delete(":id")
  eliminar(
    @Param("id", new ParseUUIDPipe()) id: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoDeleteResponse> {
    return this.cursosService.eliminar(id, requireUsuarioId(usuario))
  }

  // ── Áreas individuales ──────────────────────────────────────────

  @Post(":cursoId/areas")
  agregarArea(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(agregarCursoAreaInputSchema)) input: AgregarCursoAreaInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoAreaMutacionResponse> {
    return this.cursosService.agregarArea(cursoId, input, requireUsuarioId(usuario))
  }

  @Patch(":cursoId/areas/:cursoAreaId")
  actualizarCursoArea(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("cursoAreaId", new ParseUUIDPipe()) cursoAreaId: string,
    @Body(new ZodValidationPipe(actualizarCursoAreaInputSchema)) input: ActualizarCursoAreaInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoAreaMutacionResponse> {
    return this.cursosService.actualizarCursoArea(
      cursoId,
      cursoAreaId,
      input,
      requireUsuarioId(usuario),
    )
  }

  @Delete(":cursoId/areas/:cursoAreaId")
  @HttpCode(200)
  eliminarCursoArea(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("cursoAreaId", new ParseUUIDPipe()) cursoAreaId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<{ ok: true }> {
    return this.cursosService.eliminarCursoArea(cursoId, cursoAreaId, requireUsuarioId(usuario))
  }

  @Post(":cursoId/areas/:cursoAreaId/reemplazar")
  @HttpCode(200)
  reemplazarCursoArea(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("cursoAreaId", new ParseUUIDPipe()) cursoAreaId: string,
    @Body(new ZodValidationPipe(reemplazarCursoAreaInputSchema)) input: ReemplazarCursoAreaInput,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<CursoAreaMutacionResponse> {
    return this.cursosService.reemplazarCursoArea(
      cursoId,
      cursoAreaId,
      input,
      requireUsuarioId(usuario),
    )
  }

  @Get(":cursoId/areas/:cursoAreaId")
  obtenerCursoArea(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("cursoAreaId", new ParseUUIDPipe()) cursoAreaId: string,
  ): Promise<CursoAreaIndividualDetalle> {
    return this.cursosService.obtenerCursoArea(cursoId, cursoAreaId)
  }
}

// SesionGuard ya garantiza que `request.user` existe; el check actua de
// type-narrow para el resto del controller.
function requireUsuarioId(usuario: { id: string } | undefined): string {
  if (!usuario?.id) {
    throw new BadRequestException("Usuario de sesion no disponible")
  }
  return usuario.id
}
