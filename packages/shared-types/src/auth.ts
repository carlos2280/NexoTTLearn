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

// Mínimo 8 chars, al menos 1 mayúscula, 1 minúscula, 1 número (OWASP A07)
const passwordFuerteSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(200)
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "Password actual requerido").max(200),
    passwordNuevo: passwordFuerteSchema,
    confirmacion: z.string().min(1, "Confirmación requerida").max(200),
  })
  .refine((data) => data.passwordNuevo === data.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  })
  .refine((data) => data.passwordActual !== data.passwordNuevo, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["passwordNuevo"],
  })

export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>
