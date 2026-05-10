export type PasoLogin =
  | "credenciales"
  | "mfa"
  | "cambiar-password"
  | "aviso-privacidad"
  | "bienvenida"

export interface MfaChallenge {
  id: string
  expiraEn: Date
}

export const ORDEN_PASOS: readonly PasoLogin[] = [
  "credenciales",
  "mfa",
  "cambiar-password",
  "aviso-privacidad",
  "bienvenida",
] as const
