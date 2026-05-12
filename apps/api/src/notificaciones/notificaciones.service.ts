import { createHash } from "node:crypto"
import { Inject, Injectable, Logger } from "@nestjs/common"
import { CanalNotif, TipoEventoNotif } from "@prisma/client"
import { PrismaService } from "../common/prisma/prisma.service"
import { IEmailProvider } from "./email/email-provider.interface"
import { EMAIL_PROVIDER } from "./email/email-provider.token"
import { CrearNotificacionInput, CrearNotificacionResultado } from "./notificaciones.types"
import { TIPOS_CRITICOS, catalogoTipoEvento } from "./tipo-evento.constants"

/**
 * Servicio orquestador de notificaciones (D-S10-B6).
 *
 * Punto unico de entrada para todos los triggers TODO(S10). Encapsula las
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
  ) {}

  async crear(input: CrearNotificacionInput): Promise<CrearNotificacionResultado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: {
        id: true,
        colaborador: { select: { email: true, estadoEmpleado: true } },
      },
    })

    if (usuario === null || usuario.colaborador.estadoEmpleado === "EX_EMPLEADO") {
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
   * y no rompe el flujo del trigger origen.
   */
  private async intentarEnvioEmail(
    notificacionId: string,
    destinatario: string,
    tipo: TipoEventoNotif,
    canalesAcc: CanalNotif[],
  ): Promise<void> {
    // En P10a no hay plantillas activas (PLANTILLA_DISPONIBLE_POR_TIPO es false
    // para los 13 tipos); cuando P10c las habilite, las construye y delega aqui.
    const resultado = await this.emailProvider.enviar({
      to: destinatario,
      subject: `[NexoTT Learn] ${tipo}`,
      html: "",
      text: "",
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
}
