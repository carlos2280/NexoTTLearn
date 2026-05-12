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
import { Throttle } from "@nestjs/throttler"
import {
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
  DisponibilidadTransversalResponse,
  EditarSkillsTransversalInput,
  EditarSkillsTransversalResponse,
  IntentoTransversalAdminResponse,
  IntentoTransversalParticipanteResponse,
  ListarIntentosTransversalQuery,
  TransversalResponse,
  crearIntentoTransversalSchema,
  editarSkillsTransversalSchema,
  listarIntentosTransversalQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, EstadoCurso, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { requireIdempotencyKeyUuid } from "./transversal.helpers"
import { TransversalService } from "./transversal.service"

/**
 * Controller del modulo `transversal` (Slice 8 P8a — 6 endpoints).
 *
 * - GET    /cursos/:cursoId/transversal                          ADMIN o PARTICIPANTE inscrito
 * - POST   /cursos/:cursoId/transversal/skills                   ADMIN + X-Motivo si curso ACTIVO
 * - GET    /asignaciones/:asignacionId/transversal/disponibilidad ADMIN o propio (D-AS-9)
 * - POST   /asignaciones/:asignacionId/intentos-transversal      PARTICIPANTE para si / ADMIN
 *                                                                Idempotency-Key UUID v4
 *                                                                Throttle 10/min/usuario
 * - GET    /intentos-transversal/:intentoId                      ADMIN o propio
 * - GET    /asignaciones/:asignacionId/intentos-transversal      ADMIN o propio (paginado)
 *
 * El audit `INTENTO_TRANSVERSAL_CREADO` y `TRANSVERSAL_SKILLS_ACTUALIZADAS`
 * se registran aqui fuera del TX (D-AUDIT-1).
 */
@Controller()
export class TransversalController {
  constructor(
    private readonly transversal: TransversalService,
    private readonly auditLog: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  // E1
  @Get("cursos/:cursoId/transversal")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerPorCurso(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<TransversalResponse> {
    return this.transversal.obtenerPorCurso(cursoId, this.requireUsuario(usuario))
  }

  // E2
  @Post("cursos/:cursoId/transversal/skills")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async actualizarSkills(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Body(new ZodValidationPipe(editarSkillsTransversalSchema))
    body: EditarSkillsTransversalInput,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<EditarSkillsTransversalResponse> {
    const sesion = this.requireUsuario(usuario)
    // X-Motivo obligatorio cuando curso ACTIVO. Lo evaluamos inline porque
    // depende del estado del curso (no hay un guard generico que lo cubra).
    const cursoActivo = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { estado: true },
    })
    const requiereMotivo = cursoActivo?.estado === EstadoCurso.ACTIVO
    const motivoTrim = motivo?.trim() ?? ""
    if (requiereMotivo && motivoTrim.length === 0) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.motivoRequerido,
        message: "X-Motivo es obligatorio cuando el curso esta ACTIVO.",
      })
    }
    const resultado = await this.transversal.actualizarSkills({ cursoId, body })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.TRANSVERSAL_SKILLS_ACTUALIZADAS,
      exito: true,
      recursoTipo: "proyecto_transversal",
      recursoId: resultado.transversalId,
      metadata: {
        cursoId,
        skillsCount: resultado.skillsActualizadas.length,
        intentosRecalculados: resultado.intentosRecalculados,
        motivoLength: motivoTrim.length,
      },
      ...extractContextoHttp(req),
    })
    return resultado
  }

  // E3
  @Get("asignaciones/:asignacionId/transversal/disponibilidad")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerDisponibilidad(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<DisponibilidadTransversalResponse> {
    return this.transversal.obtenerDisponibilidad(asignacionId, this.requireUsuario(usuario))
  }

  // E4
  @Post("asignaciones/:asignacionId/intentos-transversal")
  @Roles(RolUsuario.PARTICIPANTE, RolUsuario.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async crearIntento(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Body(new ZodValidationPipe(crearIntentoTransversalSchema))
    body: CrearIntentoTransversalInput,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<CrearIntentoTransversalResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    const resultado = await this.transversal.crearIntento({
      asignacionId,
      body,
      idempotencyKey: key,
      usuario: sesion,
    })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_TRANSVERSAL_CREADO,
      exito: true,
      recursoTipo: "intento_transversal",
      recursoId: resultado.intentoId,
      metadata: {
        asignacionId,
        estado: resultado.estado,
      },
      ...extractContextoHttp(req),
    })
    return resultado
  }

  // E5
  @Get("intentos-transversal/:intentoId")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  obtenerIntento(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<IntentoTransversalAdminResponse | IntentoTransversalParticipanteResponse> {
    return this.transversal.obtenerIntento(intentoId, this.requireUsuario(usuario))
  }

  // E6
  @Get("asignaciones/:asignacionId/intentos-transversal")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  listarIntentos(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Query(new ZodValidationPipe(listarIntentosTransversalQuerySchema))
    query: ListarIntentosTransversalQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<IntentoTransversalAdminResponse | IntentoTransversalParticipanteResponse>> {
    return this.transversal.listarIntentos({
      asignacionId,
      query,
      usuario: this.requireUsuario(usuario),
    })
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
