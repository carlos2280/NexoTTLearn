import { z } from "zod"

export const rolUsuarioSchema = z.enum(["ADMIN", "PARTICIPANTE"])
export type RolUsuario = z.infer<typeof rolUsuarioSchema>

export const perfilSesionSchema = z.object({
  usuarioId: z.string().uuid(),
  colaboradorId: z.string().uuid(),
  rol: rolUsuarioSchema,
  nombre: z.string().min(1),
  email: z.string().email(),
  requiereCambioPassword: z.boolean(),
  requiereAceptarAvisoPrivacidad: z.boolean(),
  mfaHabilitado: z.boolean(),
})

export type PerfilSesion = z.infer<typeof perfilSesionSchema>

export const AVISO_VIGENTE_VERSION = "v1.0"
