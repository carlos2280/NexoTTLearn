import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common"
import {
  Asignacion,
  AsignacionDetallada,
  AutoInscripcionRequest,
  CrearAsignacionesBatchRequest,
  CrearAsignacionesBatchResponse,
  CursoDisponibleVoluntario,
  ListarAsignacionesQuery,
  PaginacionQuery,
  Paginated,
  autoInscripcionRequestSchema,
  crearAsignacionesBatchRequestSchema,
  listarAsignacionesQuerySchema,
  paginacionQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { AsignacionesService } from "./asignaciones.service"

/**
 * Controller del modulo asignaciones (Slice 6 P6a).
 *
 * 6 endpoints:
 *  - `GET /cursos/:cursoId/asignaciones` — listado paginado (ADMIN ve todo,
 *    PARTICIPANTE solo su propia asignacion — D-AS-9).
 *  - `GET /asignaciones/:asignacionId` — detalle (PARTICIPANTE solo si es
 *    suya; 404 si ajena).
 *  - `POST /cursos/:cursoId/asignaciones` — alta admin batch.
 *  - `POST /asignaciones/:asignacionId/convertir-a-asignado` — promocion
 *    voluntario→asignado (D-AS-8, race-safe en service).
 *  - `GET /cursos/disponibles-voluntario` — bandeja del participante (D90).
 *  - `POST /cursos/:cursoId/auto-inscripcion` — alta voluntaria.
 *
 * Audit log SIEMPRE fuera de la transaccion (D-AS-7); historico DENTRO del
 * service. Sin PII en metadata (D-AS-7).
 */
@Controller()
export class AsignacionesController {
  constructor(
    private readonly asignacionesService: AsignacionesService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get("cursos/disponibles-voluntario")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  async listarCursosDisponiblesVoluntario(
    @Query(new ZodValidationPipe(paginacionQuerySchema)) query: PaginacionQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<CursoDisponibleVoluntario>> {
    return await this.asignacionesService.listarCursosDisponiblesVoluntario(
      query,
      this.requireUsuario(usuario),
    )
  }

  @Get("cursos/:cursoId/asignaciones")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async listarPorCurso(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Query(new ZodValidationPipe(listarAsignacionesQuerySchema))
    query: ListarAsignacionesQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<Asignacion>> {
    return await this.asignacionesService.listarPorCurso(
      cursoId,
      query,
      this.requireUsuario(usuario),
    )
  }

  @Get("asignaciones/:asignacionId")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtener(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<AsignacionDetallada> {
    return await this.asignacionesService.obtenerPorId(asignacionId, this.requireUsuario(usuario))
  }

  @Post("cursos/:cursoId/asignaciones")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async crearBatch(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(crearAsignacionesBatchRequestSchema))
    input: CrearAsignacionesBatchRequest,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<CrearAsignacionesBatchResponse> {
    const sesion = this.requireUsuario(usuario)
    const respuesta = await this.asignacionesService.crearBatch(cursoId, input)
    for (const creada of respuesta.creadas) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.ASIGNACION_CREADA,
        exito: true,
        recursoTipo: "asignacion",
        recursoId: creada.id,
        metadata: {
          cursoId,
          colaboradorId: creada.colaboradorId,
          rol: creada.rol,
        },
        ...extractContextoHttp(req),
      })
    }
    return respuesta
  }

  @Post("asignaciones/:asignacionId/convertir-a-asignado")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async convertirAAsignado(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const respuesta = await this.asignacionesService.convertirAAsignado(
      asignacionId,
      motivo ?? "",
      sesion.usuarioId,
    )
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.ASIGNACION_CONVERTIDA,
      exito: true,
      recursoTipo: "asignacion",
      recursoId: asignacionId,
      metadata: {
        cursoId: respuesta.cursoId,
        colaboradorId: respuesta.colaboradorId,
        estadoNuevo: "ASIGNADO:ASIGNADO",
      },
      ...extractContextoHttp(req),
    })
    return respuesta
  }

  @Post("cursos/:cursoId/auto-inscripcion")
  @Roles(RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.CREATED)
  async autoInscribir(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(autoInscripcionRequestSchema))
    input: AutoInscripcionRequest,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const respuesta = await this.asignacionesService.autoInscribir(cursoId, input, sesion)
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.VOLUNTARIO_AUTOINSCRITO,
      exito: true,
      recursoTipo: "asignacion",
      recursoId: respuesta.id,
      metadata: {
        cursoId,
        colaboradorId: respuesta.colaboradorId,
        origenVoluntario: input.origenVoluntario,
      },
      ...extractContextoHttp(req),
    })
    return respuesta
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
