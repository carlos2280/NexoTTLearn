import { z } from "zod"

/**
 * Bodies de los endpoints `POST /intentos-transversal/:id/finalizar` y
 * `POST /intentos-transversal/:id/anular` (Slice 8 P8b, D-S8-C6/C7).
 *
 * Ambos requieren body vacio: `finalizar` toma toda su informacion del intento
 * y del curso; `anular` recibe el motivo via header `X-Motivo`. Mantener un
 * schema explicito en lugar de `z.unknown()` documenta el contrato y bloquea
 * payloads inesperados (defensa contra clientes que envien campos por error).
 */

export const finalizarTransversalBodySchema = z.object({}).strict()

export type FinalizarTransversalBodyInput = z.infer<typeof finalizarTransversalBodySchema>

export const anularTransversalBodySchema = z.object({}).strict()

export type AnularTransversalBodyInput = z.infer<typeof anularTransversalBodySchema>

/**
 * Shape de la respuesta de `POST /intentos-transversal/:id/finalizar` —
 * resume el calculo D-S8-C4 + la replicacion D-S8-C6.
 */
export const finalizarTransversalResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    notaGlobal: z.number().min(0).max(100),
    aprobado: z.boolean(),
    skillsActualizadas: z.array(z.string().uuid()),
  })
  .strict()

export type FinalizarTransversalResponse = z.infer<typeof finalizarTransversalResponseSchema>

/**
 * Shape de la respuesta de `POST /intentos-transversal/:id/anular` — el
 * cliente solo necesita saber que la anulacion fue efectiva y cuantas skills
 * se recalcularon.
 */
export const anularTransversalResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    anulado: z.literal(true),
    skillsRecalculadas: z.array(z.string().uuid()),
  })
  .strict()

export type AnularTransversalResponse = z.infer<typeof anularTransversalResponseSchema>
