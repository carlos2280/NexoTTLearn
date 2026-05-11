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
  ActualizarAreasCursoInput,
  ActualizarCursoInput,
  ActualizarEntrevistaIaCursoInput,
  ActualizarModulosHabilitadosCursoInput,
  ActualizarPesosCursoInput,
  ActualizarSkillsExigidasCursoInput,
  ActualizarTransversalCursoInput,
  ActualizarUmbralesLogroCursoInput,
  CrearCursoInput,
  CursoConfiguracionResponse,
  CursoDetalle,
  CursoResumen,
  DuplicarCursoInput,
  DuplicarCursoResponse,
  ListarCursosQuery,
  ListarLogCambiosQuery,
  LogCambioCurso,
  Paginated,
  actualizarAreasCursoSchema,
  actualizarCursoSchema,
  actualizarEntrevistaIaCursoSchema,
  actualizarModulosHabilitadosCursoSchema,
  actualizarPesosCursoSchema,
  actualizarSkillsExigidasCursoSchema,
  actualizarTransversalCursoSchema,
  actualizarUmbralesLogroCursoSchema,
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

  /**
   * P4c — Transicion BORRADOR -> ACTIVO (D60, D63, D-CUR-9). Motivo OPCIONAL
   * (D-CUR-4 excepcion: publicacion es semanticamente positiva, no destructiva).
   * Idempotencia por estado: una segunda llamada sobre un curso ACTIVO rechaza
   * con 409 `conflictCursoEstado` (no se requiere `Idempotency-Key`).
   */
  @Post(":cursoId/publicar")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async publicar(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoDetalle> {
    return await this.cursosService.publicarCurso(
      cursoId,
      this.requireUsuario(usuario).usuarioId,
      motivo,
    )
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

  // P4b — configuracion del curso. Motivo condicional por estado (D-CUR-4):
  // BORRADOR no exige header `X-Motivo`; ACTIVO si. La validacion vive en el
  // service (no `@RequiereMotivo()` global). Patron heredado D-CAT-20.

  @Patch(":cursoId/areas")
  @Roles(RolUsuario.ADMIN)
  async actualizarAreas(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarAreasCursoSchema)) input: ActualizarAreasCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarAreas(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Patch(":cursoId/skills-exigidas")
  @Roles(RolUsuario.ADMIN)
  async actualizarSkillsExigidas(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarSkillsExigidasCursoSchema))
    input: ActualizarSkillsExigidasCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarSkillsExigidas(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Patch(":cursoId/modulos-habilitados")
  @Roles(RolUsuario.ADMIN)
  async actualizarModulosHabilitados(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarModulosHabilitadosCursoSchema))
    input: ActualizarModulosHabilitadosCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarModulosHabilitados(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Patch(":cursoId/pesos")
  @Roles(RolUsuario.ADMIN)
  async actualizarPesos(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarPesosCursoSchema)) input: ActualizarPesosCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarPesos(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Patch(":cursoId/umbrales-logro")
  @Roles(RolUsuario.ADMIN)
  async actualizarUmbralesLogro(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarUmbralesLogroCursoSchema))
    input: ActualizarUmbralesLogroCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarUmbralesLogro(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Patch(":cursoId/transversal")
  @Roles(RolUsuario.ADMIN)
  async actualizarTransversal(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarTransversalCursoSchema))
    input: ActualizarTransversalCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarTransversal(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
  }

  @Patch(":cursoId/entrevista-ia")
  @Roles(RolUsuario.ADMIN)
  async actualizarEntrevistaIa(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(actualizarEntrevistaIaCursoSchema))
    input: ActualizarEntrevistaIaCursoInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<CursoConfiguracionResponse> {
    return await this.cursosService.actualizarEntrevistaIa(
      cursoId,
      input,
      motivo,
      this.requireUsuario(usuario).usuarioId,
    )
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
