import { z } from "zod"
import { paginacionQuerySchema } from "../paginacion"

/**
 * `z.coerce.boolean()` no sirve para query strings: `Boolean("false") === true`.
 * Preprocesado explicito: "true" -> true, "false" -> false, resto -> Zod rechaza.
 *
 * Se usa `z.preprocess` (no `.transform()`) para mantener el tipo input/output
 * del schema compatible con `ZodValidationPipe<T>` (que exige `ZodSchema<T>` con
 * input==output).
 */
const booleanQuerySchema = z.preprocess((v) => {
  if (v === "true") return true
  if (v === "false") return false
  return v
}, z.boolean())

export const listarClientesQuerySchema = paginacionQuerySchema.extend({
  activo: booleanQuerySchema.optional(),
  q: z.string().trim().min(2).max(100).optional(),
})

export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>
