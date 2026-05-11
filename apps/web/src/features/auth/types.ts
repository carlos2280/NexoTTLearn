import type {
  AceptarAvisoPrivacidadInput,
  CambiarPasswordInput,
  LoginInput,
  LoginResponse,
  MfaVerifyInput,
  PerfilSesion,
  RolUsuario,
} from "@nexott-learn/shared-types"

export type Rol = RolUsuario

export type UsuarioSesion = PerfilSesion

export type { LoginInput, LoginResponse, CambiarPasswordInput, AceptarAvisoPrivacidadInput }

export type VerificarMfaInput = MfaVerifyInput
