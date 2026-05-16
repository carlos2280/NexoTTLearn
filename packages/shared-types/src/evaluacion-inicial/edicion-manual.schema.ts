/**
 * Contrato HTTP de `PATCH /colaboradores/{id}/ficha/skills/{skillId}` (Slice 5
 * P5c, edicion manual celda a celda; D-EVI-11 emergente).
 *
 * `origen` NO se acepta en el body — se asigna server-side a `MANUAL`.
 * Justificacion OWASP A01: identidad y metadatos siempre del servidor; el
 * cliente no puede falsificar el origen de la nota.
 */

import { z } from "zod"

/**
 * Body de la edicion manual. `valor` admite `null` para desmarcar la nota
 * (sin evidencia, D40). Decimales con maximo 2 lugares para encajar con
 * `numeric(5,2)` en la BD.
 */
export const patchSkillRequestSchema = z
  .object({
    valor: z.number().min(0).max(100).multipleOf(0.01).nullable(),
  })
  .strict()
export type PatchSkillRequest = z.infer<typeof patchSkillRequestSchema>

/**
 * Response tras una edicion manual exitosa. `origenActual` siempre es
 * `MANUAL` (server-side). `actualizadoEn` viaja como ISO string.
 */
export const patchSkillResponseSchema = z
  .object({
    colaboradorId: z.string().uuid(),
    skillId: z.string().uuid(),
    notaActual: z.number().min(0).max(100).nullable(),
    origenActual: z.literal("MANUAL"),
    actualizadoEn: z.string().datetime(),
  })
  .strict()
export type PatchSkillResponse = z.infer<typeof patchSkillResponseSchema>
