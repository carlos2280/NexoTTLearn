import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common"
import {
  Asignacion,
  AsignacionDetallada,
  AsignacionHistoricoEntrada,
  AutoInscripcionRequest,
  CrearAsignacionesBatchRequest,
  CrearAsignacionesBatchResponse,
  CursoDisponibleVoluntario,
  ListarAsignacionesQuery,
  PaginacionQuery,
  Paginated,
  PatchResultadoEntrevistaRequest,
  ReabrirRetirarBody,
  autoInscripcionRequestSchema,
  crearAsignacionesBatchRequestSchema,
  listarAsignacionesQuerySchema,
  paginacionQuerySchema,
  patchResultadoEntrevistaRequestSchema,
  reabrirRetirarBodySchema,
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
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe"
import { SesionUsuario } from "../common/types/sesion.types"
import {
  HISTORICO_LITERAL_ASIGNADO_ASIGNADO,
  requireIdempotencyKeyUuid,
} from "./asignaciones.helpers"
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
    const key = requireIdempotencyKeyUuid(idempotencyKey)

    const resultado = await this.asignacionesService.cerrarCaso({
      asignacionId,
      bodyRaw,
      motivo: motivo ?? null,
      idempotencyKey: key,
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
    const key = requireIdempotencyKeyUuid(idempotencyKey)

    const resultado = await this.asignacionesService.reabrirCaso({
      asignacionId,
      motivo: motivo ?? "",
      idempotencyKey: key,
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

  // ===== Slice 6 P6c — Resultado entrevista cliente + historico paginado =====

  /**
   * `PATCH /asignaciones/:id/resultado-entrevista-cliente` — ADMIN. Registra
   * el resultado real con el cliente externo (D58, cap. 12.6). Audit
   * `RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO` con metadata sin PII (no incluye
   * el texto de `observacionesCliente`, solo flags `tieneObservaciones` /
   * `tieneFecha`).
   */
  @Patch("asignaciones/:asignacionId/resultado-entrevista-cliente")
  @Roles(RolUsuario.ADMIN)
  @HttpCode(HttpStatus.OK)
  async registrarResultadoEntrevistaCliente(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Body(new ZodValidationPipe(patchResultadoEntrevistaRequestSchema))
    input: PatchResultadoEntrevistaRequest,
    @CurrentUser() usuario: SesionUsuario | undefined,
    @Req() req: Request,
  ): Promise<Asignacion> {
    const sesion = this.requireUsuario(usuario)
    const respuesta = await this.asignacionesService.registrarResultadoEntrevistaCliente(
      asignacionId,
      input,
    )
    await this.auditLog.record({
      usuarioId: sesion.usuarioId,
      accion: AccionAuditoria.RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO,
      exito: true,
      recursoTipo: "asignacion",
      recursoId: asignacionId,
      metadata: {
        asignacionId,
        colaboradorId: respuesta.colaboradorId,
        cursoId: respuesta.cursoId,
        resultado: input.resultadoEntrevistaCliente,
        tieneObservaciones: input.observacionesCliente !== undefined,
        tieneFecha: input.fechaEntrevistaCliente !== undefined,
      },
      ...extractContextoHttp(req),
    })
    return respuesta
  }

  /**
   * `GET /asignaciones/:id/historico-estados` — ADMIN; PARTICIPANTE para la
   * suya (D-AS-9: 404 si ajena, NO 403). Paginado, ordenado `fecha DESC`.
   * Sin audit log (lectura admin/propia frecuente, patron heredado P5c).
   */
  @Get("asignaciones/:asignacionId/historico-estados")
  @Roles(RolUsuario.ADMIN, RolUsuario.PARTICIPANTE)
  async obtenerHistoricoEstados(
    @Param("asignacionId", ParseUUIDPipe) asignacionId: string,
    @Query(new ZodValidationPipe(paginacionQuerySchema)) query: PaginacionQuery,
    @CurrentUser() usuario: SesionUsuario | undefined,
  ): Promise<Paginated<AsignacionHistoricoEntrada>> {
    return await this.asignacionesService.obtenerHistoricoEstados(
      asignacionId,
      query,
      this.requireUsuario(usuario),
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
