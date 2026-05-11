/**
 * Contrato HTTP de `POST .../evaluacion-inicial/{previewId}/aplicar` (Slice 5
 * P5c). Decisiones que respaldan: D-EVI-3 (idempotency), D-EVI-7 (todo-o-nada),
 * D-EVI-4 (origen `ENTREVISTA_INICIAL`).
 *
 * El contrato completo vive en
 * `docs/NexoTTLearn/05_api/endpoints/evaluacion-inicial.md`.
 */

import { z } from "zod"

/**
 * Body opcional del endpoint. Todos los campos llevan default para soportar
 * body vacio. `recalcularPlanes=true` se acepta pero queda diferido al Slice 7
 * (el response devuelve `planesRecalculados: 0`).
 */
export const aplicarRequestSchema = z
  .object({
    recalcularPlanes: z.boolean().default(false),
  })
  .strict()
export type AplicarRequest = z.infer<typeof aplicarRequestSchema>

/**
 * Response del aplicar (tanto en primer aplicar como en replay idempotente).
 * `planesRecalculados` queda en 0 hasta que el Slice 7 cablee el recalculo
 * real de planes de estudio.
 */
export const aplicarResponseSchema = z
  .object({
    aplicado: z.literal(true),
    skillsActualizadas: z.number().int().nonnegative(),
    colaboradoresActualizados: z.number().int().nonnegative(),
    planesMarcadosDesactualizados: z.number().int().nonnegative(),
    planesRecalculados: z.literal(0),
    cargaId: z.string().uuid(),
  })
  .strict()
export type AplicarResponse = z.infer<typeof aplicarResponseSchema>
