/**
 * Pasos del flujo narrativo de tránsito (login + logout).
 * Comparten escenario de marca y lenguaje visual.
 */
export type PasoLogin =
  | "credenciales"
  | "mfa"
  | "cambiar-password"
  | "aviso-privacidad"
  | "bienvenida"
  | "despedida"

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
  "despedida",
] as const
