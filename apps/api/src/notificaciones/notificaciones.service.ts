import { createHash } from "node:crypto"
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PatchPreferenciasNotificacionInput } from "@nexott-learn/shared-types"
import { AccionAuditoria, CanalNotif, Prisma, TipoEventoNotif } from "@prisma/client"
import { AuditLogService } from "../common/audit/audit-log.service"
import { ContextoHttpAuditoria } from "../common/audit/audit-log.types"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { Paginated, buildPaginatedResponse, resolvePaginacion } from "../common/http/paginated"
import { PrismaService } from "../common/prisma/prisma.service"
import { AppEnv } from "../config/env.validation"
import { IEmailProvider } from "./email/email-provider.interface"
import { EMAIL_PROVIDER } from "./email/email-provider.token"
import { construirPlantilla } from "./email/plantillas"
import {
  CrearNotificacionInput,
  CrearNotificacionResultado,
  ListarNotificacionesInput,
  NotificacionDetalle,
  NotificacionResumen,
  PreferenciasNotificacion,
} from "./notificaciones.types"
import { TIPOS_CRITICOS, catalogoTipoEvento } from "./tipo-evento.constants"

/**
 * Servicio orquestador de notificaciones (D-S10-B6).
 *
 * Punto unico de entrada para todos los triggers Slice 10. Encapsula las
 * reglas §19.3:
 *  - EX_EMPLEADO no recibe nada (punto 5).
 *  - Tipos criticos ignoran preferencias silenciadas (punto 1).
 *  - Errores de email NO bloquean el evento original (punto 6).
 *
 * El envio por correo es best-effort sin retry (D-S10-B7). Si Resend falla,
 * el detalle del error queda persistido en `notificaciones.error_correo`
 * truncado a 500 chars y el caller del service nunca lo ve.
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: IEmailProvider,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async crear(input: CrearNotificacionInput): Promise<CrearNotificacionResultado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: {
        id: true,
        colaborador: { select: { email: true, estadoEmpleado: true } },
      },
    })

    if (usuario === null) {
      // Inconsistencia de datos: el caller paso un usuarioId que no existe.
      // warn (no log) porque indica un bug en el trigger origen, no el flujo
      // legitimo EX_EMPLEADO definido por D-S10-A4.
      this.logger.warn(
        `notif | omitida | usuarioHash=${this.hashId(input.usuarioId)} | tipo=${input.tipo} | motivo=usuario-no-encontrado`,
      )
      return { creada: false, motivo: "usuario-no-encontrado" }
    }

    if (usuario.colaborador.estadoEmpleado === "EX_EMPLEADO") {
      this.logger.log(
        `notif | omitida | usuarioHash=${this.hashId(input.usuarioId)} | tipo=${input.tipo} | motivo=ex_empleado`,
      )
      return { creada: false, motivo: "ex-empleado" }
    }

    const esCritico = TIPOS_CRITICOS.has(input.tipo)

    if (!esCritico) {
      const preferencia = await this.prisma.preferenciaNotificacion.findUnique({
        where: {
          // biome-ignore lint/style/useNamingConvention: identificador de clave unica compuesta generado por Prisma — debe escribirse `usuarioId_tipoEvento` para resolver al constraint `@@id([usuarioId, tipoEvento])`. Renombrar rompe el typecheck del client.
          usuarioId_tipoEvento: { usuarioId: input.usuarioId, tipoEvento: input.tipo },
        },
        select: { silenciado: true },
      })
      if (preferencia?.silenciado) {
        this.logger.log(
          `notif | omitida | usuarioHash=${this.hashId(input.usuarioId)} | tipo=${input.tipo} | motivo=silenciado`,
        )
        return { creada: false, motivo: "silenciado" }
      }
    }

    const { notificacionId } = await this.prisma.$transaction(async (tx) => {
      const notif = await tx.notificacion.create({
        data: {
          usuarioId: input.usuarioId,
          tipoEvento: input.tipo,
          esCritico,
          payload: input.payload,
        },
        select: { id: true },
      })
      await tx.notificacionCanal.create({
        data: { notificacionId: notif.id, canal: CanalNotif.IN_APP },
      })
      return { notificacionId: notif.id }
    })

    const canalesEnviados: CanalNotif[] = [CanalNotif.IN_APP]

    if (catalogoTipoEvento.tienePlantilla(input.tipo)) {
      await this.intentarEnvioEmail(
        notificacionId,
        usuario.colaborador.email,
        input.tipo,
        input.payload,
        canalesEnviados,
      )
    } else {
      this.logger.warn(
        `notif | sin plantilla | tipo=${input.tipo} | usuarioHash=${this.hashId(input.usuarioId)}`,
      )
    }

    return { creada: true, notificacionId, canalesEnviados }
  }

  /**
   * Intenta el envio por email fuera de la transaccion principal. Cualquier
   * error queda en `notificaciones.error_correo` (truncado por el provider)
   * y no rompe el flujo del trigger origen (R-S10-2 / B7).
   *
   * P10c: construye subject + html + text desde la plantilla registrada en
   * `email/plantillas/index.ts`. Si el tipo no tiene plantilla o el payload
   * persistido no cumple su shape, se loggea un warn y no se intenta envio
   * (defense in depth — `tienePlantilla()` ya filtra por tipo en el caller).
   */
  private async intentarEnvioEmail(
    notificacionId: string,
    destinatario: string,
    tipo: TipoEventoNotif,
    payload: Prisma.InputJsonObject,
    canalesAcc: CanalNotif[],
  ): Promise<void> {
    const appBaseUrl = this.config.get("APP_BASE_URL", { infer: true })
    const plantilla = construirPlantilla(tipo, payload as Prisma.JsonValue, { appBaseUrl })
    if (!plantilla) {
      this.logger.warn(`notif | payload-invalido | tipo=${tipo} | notificacionId=${notificacionId}`)
      return
    }

    const resultado = await this.emailProvider.enviar({
      to: destinatario,
      subject: plantilla.subject,
      html: plantilla.html,
      text: plantilla.text,
    })

    if (resultado.enviado) {
      await this.prisma.notificacionCanal.create({
        data: { notificacionId, canal: CanalNotif.CORREO },
      })
      canalesAcc.push(CanalNotif.CORREO)
      return
    }

    const detalle = resultado.detalle ?? resultado.motivo
    await this.prisma.notificacion.update({
      where: { id: notificacionId },
      data: { errorCorreo: detalle },
    })
    this.logger.warn(
      `notif | email fallido | tipo=${tipo} | motivo=${resultado.motivo} | notificacionId=${notificacionId}`,
    )
  }

  /** Hash truncado de un userId para loggear sin exponer el UUID completo (A09). */
  private hashId(id: string): string {
    return createHash("sha256").update(id).digest("hex").slice(0, 8)
  }

  // ===========================================================================
  // P10b — Inbox del usuario (D-S10-C3, C6, C7).
  // ===========================================================================

  /**
   * Listado paginado de notificaciones del usuario autenticado (E1).
   * Filtro D90 server-side: SIEMPRE `usuario_id = usuarioId`. El controller no
   * puede pasar otro usuario.
   */
  async listarPorUsuario(
    input: ListarNotificacionesInput,
  ): Promise<Paginated<NotificacionResumen>> {
    const { usuarioId, query } = input
    const { skip, take, page, pageSize } = resolvePaginacion(query)

    const where: Prisma.NotificacionWhereInput = { usuarioId }
    if (query.leida !== undefined) {
      where.leida = query.leida
    }
    where.archivada = query.archivada
    if (query.tipoEvento && query.tipoEvento.length > 0) {
      where.tipoEvento = { in: query.tipoEvento as TipoEventoNotif[] }
    }
    if (query.desde || query.hasta) {
      where.fechaCreacion = {
        ...(query.desde && { gte: query.desde }),
        ...(query.hasta && { lte: query.hasta }),
      }
    }

    const orderBy: Prisma.NotificacionOrderByWithRelationInput = {
      fechaCreacion: query.sort === "fechaCreacion" ? "asc" : "desc",
    }

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.notificacion.findMany({
        where,
        select: SELECT_RESUMEN,
        orderBy,
        skip,
        take,
      }),
      this.prisma.notificacion.count({ where }),
    ])

    return buildPaginatedResponse(filas.map(toResumenResponse), total, page, pageSize)
  }

  /**
   * Conteo de no-leidas/no-archivadas (E2, R-S10-1). Reutiliza el indice parcial
   * `idx_notif_usuario_no_leidas` creado en P10a.
   */
  contarNoLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: { usuarioId, leida: false, archivada: false },
    })
  }

  /**
   * Detalle individual (E3, D-S10-C7). Devuelve 404 si la notif pertenece a
   * otro usuario — mismo mensaje que "no existe" para no revelar existencia
   * (patron D-S7-D1 / D-AS-9).
   */
  async obtenerDetalle(usuarioId: string, notificacionId: string): Promise<NotificacionDetalle> {
    const notif = await this.prisma.notificacion.findFirst({
      where: { id: notificacionId, usuarioId },
      select: SELECT_DETALLE,
    })
    if (!notif) {
      throw new NotFoundException({
        code: apiErrorCodes.notificacionNoEncontrada,
        message: "Notificacion no encontrada.",
      })
    }
    return toDetalleResponse(notif)
  }

  /**
   * Marcar como leida (E4). Idempotente — si ya estaba leida, no-op. 404 si la
   * notif no existe o pertenece a otro usuario. Usa `updateMany` para
   * race-safety (no hay window entre check y update).
   */
  async marcarLeida(usuarioId: string, notificacionId: string): Promise<void> {
    const resultado = await this.prisma.notificacion.updateMany({
      where: { id: notificacionId, usuarioId, leida: false },
      data: { leida: true, fechaLeida: new Date() },
    })
    if (resultado.count === 0) {
      await this.asegurarExiste(usuarioId, notificacionId)
    }
  }

  /**
   * Marcar todas como leidas (E5). Idempotente. Sin verificacion previa: si no
   * hay no-leidas, el `updateMany` es no-op y devuelve 204 igualmente.
   */
  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    await this.prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true, fechaLeida: new Date() },
    })
  }

  /**
   * Archivar (E6). Idempotente. 404 si no es del usuario. El cron archiva
   * automaticamente a los 30 dias (P10a) — este endpoint es la accion manual.
   */
  async archivar(usuarioId: string, notificacionId: string): Promise<void> {
    const resultado = await this.prisma.notificacion.updateMany({
      where: { id: notificacionId, usuarioId, archivada: false },
      data: { archivada: true },
    })
    if (resultado.count === 0) {
      await this.asegurarExiste(usuarioId, notificacionId)
    }
  }

  // ===========================================================================
  // P10b — Preferencias (D-S10-C5).
  // ===========================================================================

  /** Estado actual de preferencias (E7). */
  async obtenerPreferencias(usuarioId: string): Promise<PreferenciasNotificacion> {
    const filas = await this.prisma.preferenciaNotificacion.findMany({
      where: { usuarioId, silenciado: true },
      select: { tipoEvento: true },
      orderBy: { tipoEvento: "asc" },
    })
    return {
      silenciados: filas.map((f) => f.tipoEvento),
      tiposCriticos: Array.from(TIPOS_CRITICOS).sort(),
    }
  }

  /**
   * Aplicar silenciar/desilenciar (E8). Validaciones de negocio:
   *  - 422 `validacionTipoEnSilenciarYDesilenciar`: tipo en ambas listas.
   *  - 422 `validacionTipoCriticoNoSilenciable`: tipo critico en `silenciar`.
   *
   * Operacion globalmente idempotente: aplicar el mismo body dos veces produce
   * el mismo estado. Audit `PREFERENCIA_NOTIFICACION_ACTUALIZADA` se registra
   * FUERA del TX (D-AUDIT-2) con metadata sin PII (solo tipos enum).
   */
  async actualizarPreferencias(
    usuarioId: string,
    body: PatchPreferenciasNotificacionInput,
    contexto?: ContextoHttpAuditoria,
  ): Promise<PreferenciasNotificacion> {
    const silenciar = body.silenciar as TipoEventoNotif[]
    const desilenciar = body.desilenciar as TipoEventoNotif[]

    const interseccion = silenciar.filter((t) => desilenciar.includes(t))
    if (interseccion.length > 0) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.validacionTipoEnSilenciarYDesilenciar,
        message: "Un tipo no puede aparecer en silenciar y desilenciar a la vez.",
        details: { tipos: interseccion },
      })
    }

    const criticosSolicitados = silenciar.filter((t) => TIPOS_CRITICOS.has(t))
    if (criticosSolicitados.length > 0) {
      throw new UnprocessableEntityException({
        code: apiErrorCodes.validacionTipoCriticoNoSilenciable,
        message: "Los tipos criticos no admiten silenciar.",
        details: { tiposCriticos: criticosSolicitados },
      })
    }

    await this.prisma.$transaction(async (tx) => {
      if (desilenciar.length > 0) {
        await tx.preferenciaNotificacion.deleteMany({
          where: { usuarioId, tipoEvento: { in: desilenciar } },
        })
      }
      for (const tipo of silenciar) {
        await tx.preferenciaNotificacion.upsert({
          where: {
            // biome-ignore lint/style/useNamingConvention: identificador generado por Prisma para constraint `@@id([usuarioId, tipoEvento])`. Renombrar rompe el typecheck del client.
            usuarioId_tipoEvento: { usuarioId, tipoEvento: tipo },
          },
          update: { silenciado: true },
          create: { usuarioId, tipoEvento: tipo, silenciado: true },
        })
      }
    })

    await this.auditLog.record({
      usuarioId,
      accion: AccionAuditoria.PREFERENCIA_NOTIFICACION_ACTUALIZADA,
      exito: true,
      recursoTipo: "preferencia_notificacion",
      recursoId: usuarioId,
      metadata: { silenciadas: silenciar, desilenciadas: desilenciar },
      ...contexto,
    })

    return this.obtenerPreferencias(usuarioId)
  }

  /**
   * Diferencia 404 (no existe / cross-user) de 204 noop (ya en el estado
   * destino). Si la notif existe para el usuario, el caller hizo un noop
   * idempotente legitimo; si no, devolvemos 404 con el mismo mensaje sin
   * revelar existencia cross-user.
   */
  private async asegurarExiste(usuarioId: string, notificacionId: string): Promise<void> {
    const existe = await this.prisma.notificacion.findFirst({
      where: { id: notificacionId, usuarioId },
      select: { id: true },
    })
    if (!existe) {
      throw new NotFoundException({
        code: apiErrorCodes.notificacionNoEncontrada,
        message: "Notificacion no encontrada.",
      })
    }
  }
}

// =============================================================================
// Selects + mappers para inbox (separacion de concerns; mantiene service limpio).
// =============================================================================

const SELECT_RESUMEN = {
  id: true,
  tipoEvento: true,
  esCritico: true,
  fechaCreacion: true,
  leida: true,
  fechaLeida: true,
  archivada: true,
} as const satisfies Prisma.NotificacionSelect

const SELECT_DETALLE = {
  id: true,
  tipoEvento: true,
  esCritico: true,
  payload: true,
  fechaCreacion: true,
  leida: true,
  fechaLeida: true,
  archivada: true,
  errorCorreo: true,
  canales: { select: { canal: true } },
} as const satisfies Prisma.NotificacionSelect

function toResumenResponse(fila: {
  id: string
  tipoEvento: TipoEventoNotif
  esCritico: boolean
  fechaCreacion: Date
  leida: boolean
  fechaLeida: Date | null
  archivada: boolean
}): NotificacionResumen {
  return {
    id: fila.id,
    tipoEvento: fila.tipoEvento,
    esCritico: fila.esCritico,
    fechaCreacion: fila.fechaCreacion.toISOString(),
    leida: fila.leida,
    fechaLeida: fila.fechaLeida?.toISOString() ?? null,
    archivada: fila.archivada,
  }
}

function toDetalleResponse(fila: {
  id: string
  tipoEvento: TipoEventoNotif
  esCritico: boolean
  payload: Prisma.JsonValue
  fechaCreacion: Date
  leida: boolean
  fechaLeida: Date | null
  archivada: boolean
  errorCorreo: string | null
  canales: ReadonlyArray<{ canal: CanalNotif }>
}): NotificacionDetalle {
  const payloadPlano: Record<string, unknown> =
    typeof fila.payload === "object" && fila.payload !== null && !Array.isArray(fila.payload)
      ? (fila.payload as Record<string, unknown>)
      : {}
  return {
    id: fila.id,
    tipoEvento: fila.tipoEvento,
    esCritico: fila.esCritico,
    payload: payloadPlano,
    fechaCreacion: fila.fechaCreacion.toISOString(),
    leida: fila.leida,
    fechaLeida: fila.fechaLeida?.toISOString() ?? null,
    archivada: fila.archivada,
    canalesEnviados: fila.canales.map((c) => c.canal),
    errorCorreo: fila.errorCorreo,
  }
}
