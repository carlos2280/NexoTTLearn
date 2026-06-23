import type { ColaboradorAdminResumen } from "@nexott-learn/shared-types"

export type ModoDialogPersonas =
  | "cerrado"
  | "crear"
  | "ver-ficha"
  | "regenerar-password"
  | "desbloquear"
  | "cambiar-rol"
  | "credencial-creada"
  | "credencial-regenerada"

export interface CredencialMostrar {
  readonly nombre: string
  readonly email: string
  readonly passwordTemporal: string
  readonly caducaEn: string
}

export interface EstadoDialog {
  readonly modo: ModoDialogPersonas
  readonly persona: ColaboradorAdminResumen | null
  readonly credencial: CredencialMostrar | null
}

export const ESTADO_DIALOG_CERRADO: EstadoDialog = {
  modo: "cerrado",
  persona: null,
  credencial: null,
}
