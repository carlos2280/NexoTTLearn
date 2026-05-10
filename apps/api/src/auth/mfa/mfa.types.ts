import { PerfilSesion } from "../auth.types"

/**
 * Respuesta del setup inicial. `qrCodeDataUrl` es una imagen PNG en data URL
 * lista para `<img src=...>`. `secret` se devuelve en su forma base32 para que
 * el cliente lo pueda copiar manualmente como respaldo.
 */
export interface MfaSetupResponse {
  readonly qrCodeDataUrl: string
  readonly secret: string
}

export interface MfaVerifyResultado {
  readonly usuarioId: string
  readonly perfil: PerfilSesion
}

export interface MfaCrearChallengeResultado {
  readonly mfaChallengeId: string
}
