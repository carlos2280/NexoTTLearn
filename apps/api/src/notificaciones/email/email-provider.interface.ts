/**
 * Contrato del provider de email (D-S10-B2).
 *
 * Implementado por `ResendEmailProvider` (Resend SDK) y `MockEmailProvider`
 * (in-memory para tests). El service `NotificacionesService` inyecta este
 * contrato via `@Inject(EMAIL_PROVIDER)` y nunca toca la SDK directamente.
 *
 * Best-effort sin retry (D-S10-B7): los errores se devuelven en
 * `EnvioResultado` y `NotificacionesService` los persiste en
 * `notificaciones.error_correo` sin propagar al trigger origen.
 */

export interface EnvioArgs {
  readonly to: string
  readonly subject: string
  readonly html: string
  readonly text: string
}

export type MotivoFallo = "flag-deshabilitado" | "destinatario-invalido" | "error-resend"

export type EnvioResultado =
  | { readonly enviado: true }
  | {
      readonly enviado: false
      readonly motivo: MotivoFallo
      readonly detalle?: string
    }

export interface IEmailProvider {
  readonly providerName: "mock" | "resend"
  enviar(args: EnvioArgs): Promise<EnvioResultado>
}
