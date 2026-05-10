import { Prisma } from "@prisma/client"

export const SELECT_COLABORADOR_BASE = {
  id: true,
  email: true,
  nombre: true,
  estadoEmpleado: true,
  createdAt: true,
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
    readonly passwordInicialCaducaEn: Date
  }
  readonly modoEntrega: "MANUAL"
  readonly passwordTemporal: string
  /**
   * En P1a el flag `habilitarMfa` recibido en el alta NO se persiste; el setup
   * real ocurre cuando el usuario hace `auth/mfa/setup` + `enable` en P1b. Si
   * el admin lo solicito en true, se devuelve esta nota como recordatorio.
   */
  readonly mfaPendienteSetupP1B: boolean
}
