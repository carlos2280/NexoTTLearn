import { z } from "zod"
import { paginacionQuerySchema } from "../paginacion"

export const listarSeccionesQuerySchema = paginacionQuerySchema.extend({
  moduloId: z.string().uuid().optional(),
})

export type ListarSeccionesQuery = z.infer<typeof listarSeccionesQuerySchema>
