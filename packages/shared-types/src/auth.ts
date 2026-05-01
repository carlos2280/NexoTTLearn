import { z } from "zod"

export const ROLES = ["PARTICIPANTE", "ADMIN"] as const
export type Rol = (typeof ROLES)[number]

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido").max(255),
  password: z.string().min(1, "Password requerido").max(200),
})
export type LoginInput = z.infer<typeof loginSchema>

export const usuarioPublicoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombre: z.string(),
  apellido: z.string(),
  rol: z.enum(ROLES),
  avatar: z.string().nullable(),
  debeCambiarPassword: z.boolean(),
  mfaEnabled: z.boolean(),
})
export type UsuarioPublico = z.infer<typeof usuarioPublicoSchema>

export const loginResponseSchema = z.object({
  usuario: usuarioPublicoSchema,
})
export type LoginResponse = z.infer<typeof loginResponseSchema>
