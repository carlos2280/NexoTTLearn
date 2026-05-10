import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import type {
  CandidatosDisponiblesQuery,
  CandidatosDisponiblesResponse,
  InscripcionDeleteAdminResponse,
  InscripcionDiagnosticoListResponse,
  InvitarCandidatosBody,
  InvitarCandidatosResponse,
  ListarInscripcionesCursoQuery,
} from "@nexott-learn/shared-types"
import {
  candidatosDisponiblesQuerySchema,
  invitarCandidatosBodySchema,
  listarInscripcionesCursoQuerySchema,
} from "@nexott-learn/shared-types"
import { Roles } from "../../common/decorators/roles.decorator"
import { UsuarioActual } from "../../common/decorators/usuario-actual.decorator"
import { RolGuard } from "../../common/guards/rol.guard"
import { SesionGuard } from "../../common/guards/sesion.guard"
import { ZodValidationPipe } from "../../common/zod-validation.pipe"
import { InscripcionesCursoInvitarService } from "./inscripciones-curso-invitar.service"
import { InscripcionesCursoService } from "./inscripciones-curso.service"

@Controller("admin/cursos/:cursoId/inscripciones")
@UseGuards(SesionGuard, RolGuard)
@Roles("ADMIN")
export class InscripcionesCursoController {
  constructor(
    private readonly inscripcionesService: InscripcionesCursoService,
    private readonly invitarService: InscripcionesCursoInvitarService,
  ) {}

  @Get()
  listar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Query(new ZodValidationPipe(listarInscripcionesCursoQuerySchema))
    query: ListarInscripcionesCursoQuery,
  ): Promise<InscripcionDiagnosticoListResponse> {
    return this.inscripcionesService.listarPorCurso(cursoId, query)
  }

  @Get("candidatos-disponibles")
  buscarCandidatos(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Query(new ZodValidationPipe(candidatosDisponiblesQuerySchema))
    query: CandidatosDisponiblesQuery,
  ): Promise<CandidatosDisponiblesResponse> {
    return this.invitarService.buscarCandidatosDisponibles(cursoId, query)
  }

  @Post()
  @HttpCode(201)
  invitar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Body(new ZodValidationPipe(invitarCandidatosBodySchema)) body: InvitarCandidatosBody,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<InvitarCandidatosResponse> {
    return this.invitarService.invitarCandidatos(cursoId, body, requireUsuarioId(usuario))
  }

  @Delete(":inscripcionId")
  @HttpCode(200)
  quitar(
    @Param("cursoId", new ParseUUIDPipe()) cursoId: string,
    @Param("inscripcionId", new ParseUUIDPipe()) inscripcionId: string,
    @UsuarioActual() usuario: { id: string } | undefined,
  ): Promise<InscripcionDeleteAdminResponse> {
    return this.inscripcionesService.quitarDelCurso(
      cursoId,
      inscripcionId,
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
