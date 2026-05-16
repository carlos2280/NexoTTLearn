import { z } from "zod"
import { perfilSesionSchema } from "./perfil.schema"

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1),
})

export const loginResponseSinMfaSchema = z.object({
  mfaRequired: z.literal(false),
  perfil: perfilSesionSchema,
  // Token CSRF emitido tras `req.session.regenerate`. Se devuelve en el body
  // porque cuando web y API viven en hostnames distintos (cross-site) el JS
  // del frontend no puede leer la cookie `XSRF-TOKEN` via `document.cookie`
  // (esta asociada al dominio de la API). El cliente lo guarda en memoria y
  // lo reenvia en el header `X-XSRF-TOKEN` en cada mutacion.
  csrfToken: z.string().min(1),
})

export const mfaVerifyResponseSchema = z.object({
  perfil: perfilSesionSchema,
  csrfToken: z.string().min(1),
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
export type MfaVerifyResponse = z.infer<typeof mfaVerifyResponseSchema>
