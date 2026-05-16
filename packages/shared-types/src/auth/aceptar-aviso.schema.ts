import { z } from "zod"

export const aceptarAvisoPrivacidadSchema = z.object({
  versionAviso: z.string().min(1).max(50),
})

export type AceptarAvisoPrivacidadInput = z.infer<typeof aceptarAvisoPrivacidadSchema>
