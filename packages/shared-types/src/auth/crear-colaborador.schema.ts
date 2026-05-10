import { z } from "zod"
import { rolUsuarioSchema } from "./perfil.schema"

export const crearColaboradorSchema = z.object({
  email: z.string().email().max(254),
  nombre: z.string().min(1).max(200),
  rol: rolUsuarioSchema,
  habilitarMfa: z.boolean().default(false),
})

export type CrearColaboradorInput = z.infer<typeof crearColaboradorSchema>
