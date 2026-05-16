import { z } from "zod"
import { perfilSesionSchema } from "./perfil.schema"

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1),
})

export const loginResponseSinMfaSchema = z.object({
  mfaRequired: z.literal(false),
  perfil: perfilSesionSchema,
})

export const loginResponseConMfaSchema = z.object({
  mfaRequired: z.literal(true),
  mfaChallengeId: z.string().uuid(),
})

export const loginResponseSchema = z.discriminatedUnion("mfaRequired", [
  loginResponseSinMfaSchema,
  loginResponseConMfaSchema,
])

export type LoginInput = z.infer<typeof loginSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
