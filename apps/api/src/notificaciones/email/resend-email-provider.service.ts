import { Injectable, Logger } from "@nestjs/common"
import { Resend } from "resend"
import { CifradoService } from "../../common/crypto/cifrado.service"
import { PrismaService } from "../../common/prisma/prisma.service"
import { EnvioArgs, EnvioResultado, IEmailProvider } from "./email-provider.interface"

/**
 * Direccion `from` canonica para todos los correos del sistema (D-S10-B3).
 * Vive aqui en lugar de en una variable de entorno porque NO se cambia por
 * entorno — es la identidad del producto.
 */
const FROM_CANONICO = "NexoTT Learn <notificaciones@nexott.app>" as const

/** Longitud maxima para `notificaciones.error_correo` (D-S10-B7 / R-S10-3). */
const LONGITUD_MAX_ERROR = 500

/** Patron que matchea API keys de Resend para filtrarlas antes de loggear. */
const PATRON_API_KEY_RESEND = /re_[A-Za-z0-9_-]+/g

/**
 * Provider real de email basado en Resend SDK (D-S10-B2 / D-S10-B3).
 *
 * Resuelto cuando `NODE_ENV !== 'test'`. Lee `ConfiguracionSistema` en cada
 * envio (no en arranque): si `modo_entrega_password=MANUAL` o falta la
 * `resend_api_key_cifrada`, devuelve `{ enviado: false, motivo: 'flag-deshabilitado' }`.
 *
 * La API key se persiste cifrada (AES-256-GCM) y se descifra con `CifradoService`
 * usando la clave maestra `SECRETS_ENCRYPTION_KEY`. NUNCA se loggea — los logs
 * pasan por `redactarApiKey()` para eliminar cualquier patron `re_*`.
 *
 * Best-effort sin retry (D-S10-B7): errores de Resend se mapean a
 * `{ enviado: false, motivo: 'error-resend', detalle }`. El service caller
 * persiste `detalle` truncado en `notificaciones.error_correo`.
 */
@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  public readonly providerName = "resend" as const

  private readonly logger = new Logger(ResendEmailProvider.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cifrado: CifradoService,
  ) {}

  async enviar(args: EnvioArgs): Promise<EnvioResultado> {
    const configuracion = await this.prisma.configuracionSistema.findUnique({
      where: { id: 1 },
      select: { modoEntregaPassword: true, resendApiKeyCifrada: true },
    })

    if (
      configuracion === null ||
      configuracion.modoEntregaPassword !== "AUTOMATICO" ||
      configuracion.resendApiKeyCifrada === null
    ) {
      return { enviado: false, motivo: "flag-deshabilitado" }
    }

    let apiKey: string
    try {
      apiKey = this.cifrado.desencriptar(configuracion.resendApiKeyCifrada)
    } catch (error) {
      this.logger.warn(
        `resend | descifrado fallido | error=${this.redactar(this.mensajeError(error))}`,
      )
      return { enviado: false, motivo: "flag-deshabilitado" }
    }

    const cliente = new Resend(apiKey)

    try {
      const { error } = await cliente.emails.send({
        from: FROM_CANONICO,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      })

      if (error) {
        const detalle = this.formatearDetalle(error)
        this.logger.warn(`resend | envio fallido | detalle=${detalle}`)
        return { enviado: false, motivo: "error-resend", detalle }
      }

      // Aplicar APP_BASE_URL ya está bajo responsabilidad de las plantillas
      // en P10c — aqui solo despachamos.
      return { enviado: true }
    } catch (error) {
      const detalle = this.formatearDetalle(error)
      this.logger.warn(`resend | excepcion | detalle=${detalle}`)
      return { enviado: false, motivo: "error-resend", detalle }
    }
  }

  /** Construye el detalle final que se persiste en `notificaciones.error_correo`. */
  private formatearDetalle(error: unknown): string {
    const mensaje = this.mensajeError(error)
    return this.redactar(mensaje).slice(0, LONGITUD_MAX_ERROR)
  }

  private mensajeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === "string") {
      return error
    }
    if (typeof error === "object" && error !== null) {
      const message = (error as Record<string, unknown>).message
      if (typeof message === "string") {
        return message
      }
      try {
        return JSON.stringify(error)
      } catch {
        return "Error desconocido"
      }
    }
    return "Error desconocido"
  }

  /** Filtra patrones tipo `re_xxx` (API keys de Resend) — R-S10-3. */
  private redactar(texto: string): string {
    return texto.replace(PATRON_API_KEY_RESEND, "[REDACTED]")
  }
}
