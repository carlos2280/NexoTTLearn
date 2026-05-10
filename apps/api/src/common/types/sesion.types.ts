import "express-session"
import { RolUsuario as RolUsuarioPrisma } from "@prisma/client"

export type RolUsuario = RolUsuarioPrisma

export interface SesionUsuario {
  readonly usuarioId: string
  readonly rol: RolUsuario
}

declare module "express-session" {
  interface SessionData {
    usuarioId?: string
    rol?: RolUsuario
    csrfToken?: string
  }
}
