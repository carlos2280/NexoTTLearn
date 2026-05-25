import { z } from "zod"

export const mfaEnableSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/u, "El codigo MFA debe ser de 6 digitos numericos"),
})

export type MfaEnableInput = z.infer<typeof mfaEnableSchema>
