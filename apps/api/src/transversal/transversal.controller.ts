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
  UnprocessableEntityException,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import {
  AnularTransversalBodyInput,
  AnularTransversalResponse,
  CargarCapaComprensionInput,
  CargarCapaCualitativaInput,
  CargarCapaTestsInput,
  CrearIntentoTransversalInput,
  CrearIntentoTransversalResponse,
  DisponibilidadTransversalResponse,
  EditarSkillsTransversalInput,
  EditarSkillsTransversalResponse,
  FinalizarTransversalBodyInput,
  FinalizarTransversalResponse,
  IntentoTransversalAdminResponse,
  IntentoTransversalListadoItem,
  IntentoTransversalParticipanteResponse,
  ListarIntentosTransversalCursoQuery,
  ListarIntentosTransversalQuery,
  TransversalResponse,
  anularTransversalBodySchema,
  cargarCapaComprensionSchema,
  cargarCapaCualitativaSchema,
  cargarCapaTestsSchema,
  crearIntentoTransversalSchema,
  editarSkillsTransversalSchema,
  finalizarTransversalBodySchema,
  listarIntentosTransversalCursoQuerySchema,
  listarIntentosTransversalQuerySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated } from "../common/http/paginated"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
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
 * - GET    /cursos/:cursoId/intentos-transversal                 ADMIN (listado del curso)
 *
 * El audit `INTENTO_TRANSVERSAL_CREADO` y `TRANSVERSAL_SKILLS_ACTUALIZADAS`
 * se registran aqui fuera del TX (D-AUDIT-1).
 */
@Controller()
export class TransversalController {
  constructor(
    private readonly transversal: TransversalService,
    private readonly auditLog: AuditLogService,
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
    // X-Motivo obligatorio cuando curso ACTIVO. La consulta vive en el service
    // (regla "controller no toca Prisma"); no hay un guard generico que cubra
    // este caso porque depende del estado dinamico del curso.
    const requiereMotivo = await this.transversal.requiereMotivoPorEstadoCurso(cursoId)
    const motivoTrim = motivo?.trim() ?? ""
    if (requiereMotivo && motivoTrim.length === 0) {
      throw new UnprocessableEntityException({
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

  // E6b. Listado admin por curso (alimenta el tab "Evaluaciones > Transversal"
  // de la pantalla admin del curso). Solo admin: lista todos los intentos del
  // proyecto transversal asociado al curso, con paginacion + filtros.
  @Get("cursos/:cursoId/intentos-transversal")
  @Roles(RolUsuario.ADMIN)
  listarIntentosPorCurso(
    @Param("cursoId", ParseUUIDPipe) cursoId: string,
    @Query(new ZodValidationPipe(listarIntentosTransversalCursoQuerySchema))
    query: ListarIntentosTransversalCursoQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<IntentoTransversalListadoItem>> {
    this.requireUsuario(usuario)
    return this.transversal.listarIntentosPorCurso({ cursoId, query })
  }

  // E7
  @Post("intentos-transversal/:intentoId/capas/tests")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cargarCapaTests(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(cargarCapaTestsSchema)) body: CargarCapaTestsInput,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<IntentoTransversalAdminResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    const resultado = await this.transversal.cargarCapaTests({
      intentoId,
      body,
      idempotencyKey: key,
      usuario: sesion,
    })
    await this.registrarAuditCapa(resultado, intentoId, sesion, req)
    return resultado.response
  }

  // E8
  @Post("intentos-transversal/:intentoId/capas/cualitativa")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cargarCapaCualitativa(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(cargarCapaCualitativaSchema)) body: CargarCapaCualitativaInput,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<IntentoTransversalAdminResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    const resultado = await this.transversal.cargarCapaCualitativa({
      intentoId,
      body,
      idempotencyKey: key,
      usuario: sesion,
    })
    await this.registrarAuditCapa(resultado, intentoId, sesion, req)
    return resultado.response
  }

  // E9
  @Post("intentos-transversal/:intentoId/capas/comprension")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cargarCapaComprension(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(cargarCapaComprensionSchema)) body: CargarCapaComprensionInput,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<IntentoTransversalAdminResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    const resultado = await this.transversal.cargarCapaComprension({
      intentoId,
      body,
      idempotencyKey: key,
      usuario: sesion,
    })
    await this.registrarAuditCapa(resultado, intentoId, sesion, req)
    return resultado.response
  }

  /**
   * §5.116 — Audit `INTENTO_TRANSVERSAL_CAPA_CARGADA` para E7/E8/E9. Se registra
   * FUERA del TX (D-AUDIT-1) y NUNCA en replay idempotente (D-AUDIT-2). El
   * metadata SOLO contiene IDs + capa — sin contenido evaluable (R-S8-10).
   */
  private async registrarAuditCapa(
    resultado: {
      readonly response: IntentoTransversalAdminResponse
      readonly replay: boolean
      readonly capa: "tests" | "cualitativa" | "comprension"
    },
    intentoId: string,
    sesion: SesionUsuario,
    req: Request,
  ): Promise<void> {
    if (resultado.replay) {
      return
    }
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_TRANSVERSAL_CAPA_CARGADA,
      exito: true,
      recursoTipo: "intento_transversal",
      recursoId: intentoId,
      metadata: {
        capa: resultado.capa.toUpperCase(),
      },
      ...extractContextoHttp(req),
    })
  }

  // E10
  @Post("intentos-transversal/:intentoId/finalizar")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async finalizar(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(finalizarTransversalBodySchema))
    _body: FinalizarTransversalBodyInput,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<FinalizarTransversalResponse> {
    const sesion = this.requireUsuario(usuario)
    const resultado = await this.transversal.finalizar({ intentoId, usuario: sesion })
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.INTENTO_TRANSVERSAL_FINALIZADO,
      exito: true,
      recursoTipo: "intento_transversal",
      recursoId: resultado.intentoId,
      metadata: {
        notaGlobal: resultado.notaGlobal,
        aprobado: resultado.aprobado,
        skillsActualizadas: resultado.skillsActualizadas.length,
      },
      ...extractContextoHttp(req),
    })
    return resultado
  }

  // E11
  @Post("intentos-transversal/:intentoId/anular")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async anular(
    @Param("intentoId", ParseUUIDPipe) intentoId: string,
    @Body(new ZodValidationPipe(anularTransversalBodySchema)) _body: AnularTransversalBodyInput,
    @Motivo() motivo: string | undefined,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<AnularTransversalResponse> {
    const sesion = this.requireUsuario(usuario)
    const key = requireIdempotencyKeyUuid(idempotencyKey)
    if (typeof motivo !== "string" || motivo.length === 0) {
      // El guard global ya devuelve 422; defensa en profundidad.
      throw new UnprocessableEntityException({
        code: apiErrorCodes.motivoRequerido,
        message: "X-Motivo es obligatorio para anular un intento transversal.",
      })
    }
    const { response, replay } = await this.transversal.anular({
      intentoId,
      motivo,
      idempotencyKey: key,
      usuario: sesion,
    })
    if (!replay) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.INTENTO_TRANSVERSAL_ANULADO,
        exito: true,
        recursoTipo: "intento_transversal",
        recursoId: response.intentoId,
        metadata: {
          motivoLength: motivo.length,
          skillsRecalculadas: response.skillsRecalculadas.length,
        },
        ...extractContextoHttp(req),
      })
    }
    return response
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
