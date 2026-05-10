export type Rol = "ADMIN" | "PARTICIPANTE"

export interface UsuarioSesion {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: Rol
  avatar: string | null
  mfaHabilitado: boolean
  requiereCambioPassword: boolean
  requiereAceptarAvisoPrivacidad: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  mfaRequired: boolean
  mfaChallengeId?: string
  mfaChallengeExpiraEn?: string
}

export interface VerificarMfaInput {
  challengeId: string
  codigo: string
}

export interface CambiarPasswordInput {
  passwordActual: string
  passwordNueva: string
}

export interface AceptarAvisoPrivacidadInput {
  versionAviso: string
}
