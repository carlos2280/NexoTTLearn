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

/**
 * `finalizar` acepta un ajuste manual OPCIONAL de la nota por el admin
 * ("Publicar y cerrar"): humano en el loop sobre el numero, no solo el texto.
 * `notaAjustada` y `motivoAjuste` van juntos (o ninguno): si el admin corrige la
 * nota, el motivo es obligatorio (traza de accountability, calca la entrevista IA
 * E19). Sin ajuste = se publica la nota calculada de las capas.
 */
export const finalizarTransversalBodySchema = z
  .object({
    notaAjustada: z.number().min(0).max(100).optional(),
    motivoAjuste: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .refine((d) => (d.notaAjustada === undefined) === (d.motivoAjuste === undefined), {
    message: "El motivo es obligatorio al ajustar la nota (y solo cuando se ajusta).",
    path: ["motivoAjuste"],
  })

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
    // Nota EFECTIVA publicada (la ajustada por el admin si la corrigio, si no la
    // calculada). Es la que ve el alumno y la que alimenta las skills.
    notaGlobal: z.number().min(0).max(100),
    // La nota que la IA calculo de las capas, o null si no era computable y el
    // admin fijo la nota a mano. Permite auditar el "de X a Y" del ajuste.
    notaCalculada: z.number().min(0).max(100).nullable(),
    // La correccion manual del admin, o null si publico la calculada tal cual.
    notaAjustada: z.number().min(0).max(100).nullable(),
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
