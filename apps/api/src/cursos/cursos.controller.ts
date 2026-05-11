import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common"
import {
  ActualizarCursoInput,
  CrearCursoInput,
  CursoDetalle,
  CursoResumen,
  DuplicarCursoInput,
  DuplicarCursoResponse,
  ListarCursosQuery,
  ListarLogCambiosQuery,
  LogCambioCurso,
  Paginated,
  actualizarCursoSchema,
  crearCursoSchema,
  duplicarCursoSchema,
  listarCursosQuerySchema,
  listarLogCambiosQuerySchema,
} from "@nexott-learn/shared-types"
import { RolUsuario } from "@prisma/client"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { CursosService } from "./cursos.service"

@Controller("cursos")
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listar(
    @Query(new ZodValidationPipe(listarCursosQuerySchema)) query: ListarCursosQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<CursoResumen>> {
    return await this.cursosService.listar(query, this.requireUsuario(usuario))
  }

  @Get(":cursoId")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoDetalle> {
    return await this.cursosService.obtenerDetalle(cursoId, this.requireUsuario(usuario))
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Body(new ZodValidationPipe(crearCursoSchema)) input: CrearCursoInput,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoDetalle> {
    return await this.cursosService.crear(input, this.requireUsuario(usuario).usuarioId)
  }

  /**
   * D-CUR-4: el motivo se valida en el service (condicional por estado, no
   * por endpoint). En P4a solo BORRADOR es mutable y el motivo NO es
   * obligatorio; cuando P4b habilite mutaciones en ACTIVO, el service
   * exigirá motivo via UnprocessableEntityException.
   */
  @Patch(":cursoId")
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarCursoSchema)) input: ActualizarCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoDetalle> {
    return await this.cursosService.actualizar(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Delete(":cursoId")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminar(@Param("cursoId", ParseUUIDPipe) cursoId: string): Promise<void> {
    await this.cursosService.eliminar(cursoId)
  }

  @Post(":cursoId/archivar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async archivar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoDetalle> {
    return await this.cursosService.archivar(
      cursoId,
      motivo ?? "",
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Post(":cursoId/desarchivar")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async desarchivar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoDetalle> {
    return await this.cursosService.desarchivar(cursoId, this.requireUsuario(usuario).usuarioId)
  }

  @Post(":cursoId/duplicar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.CREATED)
  async duplicar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(duplicarCursoSchema)) input: DuplicarCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<DuplicarCursoResponse> {
    return await this.cursosService.duplicar(
      cursoId,
      input,
      motivo ?? "",
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Get(":cursoId/log-cambios")
  @Roles(RolUsuario.ADMIN)
  async listarLogCambios(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Query(new ZodValidationPipe(listarLogCambiosQuerySchema)) query: ListarLogCambiosQuery,
  ): Promise<Paginated<LogCambioCurso>> {
    return await this.cursosService.listarLogCambios(cursoId, query)
  }

  private requireUsuario(usuario: SesionUsuario | undefined): SesionUsuario {
    if (!usuario) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.errorInterno,
        message: "Sesion invalida tras pasar guards.",
      })
    }
    return usuario
  }
}
