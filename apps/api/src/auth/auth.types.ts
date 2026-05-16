import { Prisma, RolUsuario } from "@prisma/client"

/**
 * Proyeccion explicita usada al validar credenciales y construir el perfil de
 * sesion. Excluye `mfaSecret` deliberadamente: en P1a no se usa y exponerlo
 * por error desde un service que mapea el resultado seria un fallo grave.
 */
export const SELECT_USUARIO_AUTH = {
  id: true,
  rol: true,
  passwordHash: true,
  passwordInicialCaduca: true,
  requiereCambioPassword: true,
  intentosFallidos: true,
  bloqueado: true,
  mfaHabilitado: true,
  ultimoLogin: true,
  colaborador: {
    select: {
      id: true,
      email: true,
      nombre: true,
      estadoEmpleado: true,
    },
  },
} as const satisfies Prisma.UsuarioSelect

export type UsuarioAuthRow = Prisma.UsuarioGetPayload<{ select: typeof SELECT_USUARIO_AUTH }>

/**
 * Datos minimos del usuario autenticado que viajan en la respuesta del login y
 * de `/auth/me`. NO incluye `passwordHash`, `mfaSecret` ni nada interno.
 */
export interface PerfilSesion {
  readonly usuarioId: string
  readonly colaboradorId: string
  readonly rol: RolUsuario
  readonly nombre: string
  readonly email: string
  readonly requiereCambioPassword: boolean
  readonly requiereAceptarAvisoPrivacidad: boolean
  readonly mfaHabilitado: boolean
}

export interface LoginResponseSinMfa {
  readonly mfaRequired: false
  readonly perfil: PerfilSesion
  readonly csrfToken: string
}

export interface LoginResponseConMfa {
  readonly mfaRequired: true
  readonly mfaChallengeId: string
}

export type LoginResponse = LoginResponseSinMfa | LoginResponseConMfa

export interface ResultadoRegenerarPassword {
  readonly modoEntrega: "MANUAL"
  readonly passwordTemporal: string
  readonly caducaEn: Date
}
