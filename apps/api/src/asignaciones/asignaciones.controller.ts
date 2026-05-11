import {
  BadRequestException,
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
  ReabrirRetirarBody,
  autoInscripcionRequestSchema,
  crearAsignacionesBatchRequestSchema,
  listarAsignacionesQuerySchema,
  paginacionQuerySchema,
  reabrirRetirarBodySchema,
} from "@nexott-learn/shared-types"
import { AccionAuditoria, RolUsuario } from "@prisma/client"
import { Request } from "express"
import { z } from "zod"
import { AuditLogService } from "../common/audit/audit-log.service"
import { extractContextoHttp } from "../common/audit/extract-contexto"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { IdempotencyKey } from "../common/decorators/idempotency-key.decorator"
import { Motivo } from "../common/decorators/motivo.decorator"
import { RequiereMotivo } from "../common/decorators/requiere-motivo.decorator"
import { Roles } from "../common/decorators/roles.decorator"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import { HISTORICO_LITERAL_ASIGNADO_ASIGNADO } from "./asignaciones.helpers"
import { AsignacionesService } from "./asignaciones.service"

const idempotencyKeyUuidSchema = z.string().uuid()

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
        estadoNuevo: HISTORICO_LITERAL_ASIGNADO_ASIGNADO,
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

  // ===== Slice 6 P6b — Transiciones de estado =====

  /**
   * `POST /asignaciones/:id/iniciar-progreso` — ADMIN o propio PARTICIPANTE.
   * Idempotente: si ya estaba en EN_PROGRESO, devuelve 200 sin auditar.
   * Audit `ASIGNACION_INICIADA` solo cuando hubo transicion real.
   */
  @Post("asignaciones/:asignacionId/iniciar-progreso")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  @HttpCode(HttpStatus.OK)
  async iniciarProgreso(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const resultado = await this.asignacionesService.iniciarProgreso(asignacionId, sesion)
    if (resultado.transiciono) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.ASIGNACION_INICIADA,
        exito: true,
        recursoTipo: "asignacion",
        recursoId: asignacionId,
        metadata: {
          cursoId: resultado.asignacion.cursoId,
          colaboradorId: resultado.asignacion.colaboradorId,
          rol: resultado.asignacion.rol,
        },
        ...extractContextoHttp(req),
      })
    }
    return resultado.asignacion
  }

  /**
   * `POST /asignaciones/:id/marcar-listo` — ADMIN. 422 si las condiciones
   * D-AS-10 no se cumplen (transversal/IA pendientes). Audit
   * `ASIGNACION_LISTA`.
   */
  @Post("asignaciones/:asignacionId/marcar-listo")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async marcarListo(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const respuesta = await this.asignacionesService.marcarListo(asignacionId, sesion.usuarioId)
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.ASIGNACION_LISTA,
      exito: true,
      recursoTipo: "asignacion",
      recursoId: asignacionId,
      metadata: {
        cursoId: respuesta.cursoId,
        colaboradorId: respuesta.colaboradorId,
        rol: respuesta.rol,
      },
      ...extractContextoHttp(req),
    })
    return respuesta
  }

  /**
   * `POST /asignaciones/:id/cerrar-caso` — ADMIN, Idempotency-Key obligatoria.
   * X-Motivo opcional. Body discriminado por rol (D-AS-12): el service
   * valida con Zod tras conocer el rol de la asignacion. Audit
   * `ASIGNACION_CERRADA` solo en el primer ejecutar (no en replay).
   */
  @Post("asignaciones/:asignacionId/cerrar-caso")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cerrarCaso(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Body() bodyRaw: unknown,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const keyValida =
      idempotencyKey !== undefined && idempotencyKeyUuidSchema.safeParse(idempotencyKey).success
    if (!keyValida) {
      throw new BadRequestException({
        code: apiErrorCodes.idempotencyKeyRequerida,
        message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
      })
    }

    const resultado = await this.asignacionesService.cerrarCaso({
      asignacionId,
      bodyRaw,
      motivo: motivo ?? null,
      idempotencyKey,
      autorUsuarioId: sesion.usuarioId,
    })

    if (resultado.nuevo) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.ASIGNACION_CERRADA,
        exito: true,
        recursoTipo: "asignacion",
        recursoId: asignacionId,
        metadata: {
          cursoId: resultado.asignacion.cursoId,
          colaboradorId: resultado.asignacion.colaboradorId,
          rol: resultado.asignacion.rol,
          estadoFinal:
            resultado.asignacion.rol === "ASIGNADO"
              ? resultado.asignacion.estadoAsignado
              : resultado.asignacion.estadoVoluntario,
          motivoLength: motivo?.length ?? 0,
        },
        ...extractContextoHttp(req),
      })
    }
    return resultado.asignacion
  }

  /**
   * `POST /asignaciones/:id/reabrir-caso` — ADMIN, X-Motivo + Idempotency-Key
   * obligatorios. Body vacio (Zod `.strict()` rechaza claves desconocidas).
   * Audit `ASIGNACION_REABIERTA` solo en el primer ejecutar.
   */
  @Post("asignaciones/:asignacionId/reabrir-caso")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async reabrirCaso(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Body(new ZodValidationPipe(reabrirRetirarBodySchema)) _body: ReabrirRetirarBody,
    @IdempotencyKey() idempotencyKey: string | undefined,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const keyValida =
      idempotencyKey !== undefined && idempotencyKeyUuidSchema.safeParse(idempotencyKey).success
    if (!keyValida) {
      throw new BadRequestException({
        code: apiErrorCodes.idempotencyKeyRequerida,
        message: "El header Idempotency-Key es obligatorio y debe ser un UUID v4.",
      })
    }

    const resultado = await this.asignacionesService.reabrirCaso({
      asignacionId,
      motivo: motivo ?? "",
      idempotencyKey,
      autorUsuarioId: sesion.usuarioId,
    })

    if (resultado.nuevo) {
      await this.auditLog.record({
        usuarioId: sesion.usuarioId,
        accion: AccionAuditoria.ASIGNACION_REABIERTA,
        exito: true,
        recursoTipo: "asignacion",
        recursoId: asignacionId,
        metadata: {
          cursoId: resultado.asignacion.cursoId,
          colaboradorId: resultado.asignacion.colaboradorId,
          rol: resultado.asignacion.rol,
          motivoLength: motivo?.length ?? 0,
        },
        ...extractContextoHttp(req),
      })
    }
    return resultado.asignacion
  }

  /**
   * `POST /asignaciones/:id/retirar` — ADMIN, X-Motivo obligatorio. Body
   * vacio. Sin idempotencia (operacion final unica). Audit
   * `ASIGNACION_RETIRADA`.
   */
  @Post("asignaciones/:asignacionId/retirar")
  @Roles(RolUsuario.ADMIN)
  @RequiereMotivo()
  @HttpCode(HttpStatus.OK)
  async retirar(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Body(new ZodValidationPipe(reabrirRetirarBodySchema)) _body: ReabrirRetirarBody,
    @Motivo() motivo: string | undefined,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const respuesta = await this.asignacionesService.retirar(
      asignacionId,
      motivo ?? "",
      sesion.usuarioId,
    )
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.ASIGNACION_RETIRADA,
      exito: true,
      recursoTipo: "asignacion",
      recursoId: asignacionId,
      metadata: {
        cursoId: respuesta.cursoId,
        colaboradorId: respuesta.colaboradorId,
        rol: respuesta.rol,
        motivoLength: motivo?.length ?? 0,
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
