import { z } from "zod"

export const mfaVerifySchema = z.object({
  mfaChallengeId: z.string().uuid("mfaChallengeId debe ser un UUID"),
  codigo: z.string().regex(/^\d{6}$/u, "El codigo MFA debe ser de 6 digitos numericos"),
})

export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>
