import { z } from "zod"

export const regenerarPasswordInicialSchema = z.object({
  usuarioId: z.string().uuid(),
})

export type RegenerarPasswordInicialInput = z.infer<typeof regenerarPasswordInicialSchema>
