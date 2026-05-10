import { z } from "zod"
import { paginacionQuerySchema } from "../paginacion"

export const listarAreasQuerySchema = paginacionQuerySchema.extend({
  q: z.string().trim().min(2).max(100).optional(),
})

export type ListarAreasQuery = z.infer<typeof listarAreasQuerySchema>
