import { z } from "zod"
import { type RolUsuario, rolUsuarioSchema } from "./perfil.schema"

export const cambiarRolSchema = z.object({
  rol: rolUsuarioSchema,
})

export type CambiarRolInput = z.infer<typeof cambiarRolSchema>

export interface CambiarRolResponse {
  readonly usuarioId: string
  readonly rolAnterior: RolUsuario
  readonly rolNuevo: RolUsuario
}
