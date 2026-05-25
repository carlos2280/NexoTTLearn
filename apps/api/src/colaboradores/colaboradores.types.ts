import { Prisma } from "@prisma/client"

export const SELECT_COLABORADOR_BASE = {
  id: true,
  email: true,
  nombre: true,
  estadoEmpleado: true,
  createdAt: true,
} as const satisfies Prisma.ColaboradorSelect

export const SELECT_COLABORADOR_ADMIN = {
  id: true,
  email: true,
  nombre: true,
  estadoEmpleado: true,
  fechaOffBoarding: true,
  createdAt: true,
  usuario: {
    select: {
      id: true,
      rol: true,
      bloqueado: true,
      mfaHabilitado: true,
      requiereCambioPassword: true,
      requiereSetupMfa: true,
      intentosFallidos: true,
      ultimoLogin: true,
    },
  },
} as const satisfies Prisma.ColaboradorSelect

export interface AltaColaboradorResponse {
  readonly colaborador: {
    readonly id: string
    readonly email: string
    readonly nombre: string
    readonly estadoEmpleado: "ACTIVO" | "EX_EMPLEADO"
  }
  readonly usuario: {
    readonly id: string
    readonly rol: "ADMIN" | "PARTICIPANTE"
    readonly requiereCambioPassword: true
    /**
     * Refleja `dto.habilitarMfa`: si el admin marco la casilla, se persistio
     * `Usuario.requiereSetupMfa=true` y el `MustSetupMfaGuard` obligara al
     * usuario a completar /auth/mfa/setup + /auth/mfa/enable en su primer
     * acceso antes de operar otros endpoints (P1b — D-MFA-4).
     */
    readonly requiereSetupMfa: boolean
    readonly passwordInicialCaducaEn: Date
  }
  readonly modoEntrega: "MANUAL"
  readonly passwordTemporal: string
}
