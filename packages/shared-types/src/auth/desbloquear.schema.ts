import { z } from "zod"

export const desbloquearSchema = z.object({
  usuarioId: z.string().uuid(),
})

export type DesbloquearInput = z.infer<typeof desbloquearSchema>
