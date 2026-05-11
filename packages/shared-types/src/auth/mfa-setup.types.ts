/**
 * Respuesta de `POST /auth/mfa/setup`. `qrCodeDataUrl` viene en data URL PNG
 * (lista para `<img src=...>`). `secret` es la cadena base32 que el usuario
 * puede copiar manualmente como respaldo (autenticador sin escanear QR).
 *
 * Replica del shape del backend en `apps/api/src/auth/mfa/mfa.types.ts`.
 */
export interface MfaSetupResponse {
  readonly qrCodeDataUrl: string
  readonly secret: string
}
