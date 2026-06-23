import type { RolUsuario } from "@nexott-learn/shared-types"

/** El rol destino siempre es el opuesto al actual (solo hay dos roles). */
export function rolOpuesto(rol: RolUsuario): RolUsuario {
  return rol === "ADMIN" ? "PARTICIPANTE" : "ADMIN"
}
