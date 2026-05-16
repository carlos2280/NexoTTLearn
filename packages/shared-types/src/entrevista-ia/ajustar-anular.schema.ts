import { z } from "zod"

/**
 * Bodies de los endpoints admin de control de calidad sobre intentos de
 * entrevista IA (D-S8-D5 / D-S8-D6 / D89).
 */

export const ajustarEntrevistaBodySchema = z
  .object({
    notaAjustada: z.number().int().min(0).max(100),
  })
  .strict()

export type AjustarEntrevistaBodyInput = z.infer<typeof ajustarEntrevistaBodySchema>

/**
 * `POST .../anular` no recibe body; el motivo viaja en `X-Motivo`. El schema
 * vacio (`strict()`) endurece el contrato: cualquier campo extra es 400.
 */
export const anularEntrevistaBodySchema = z.object({}).strict()

export type AnularEntrevistaBodyInput = z.infer<typeof anularEntrevistaBodySchema>

/**
 * `POST .../finalizar` tampoco recibe body en su forma actual; mantenemos el
 * schema vacio para que cualquier evolucion futura tenga un lugar dedicado y
 * no se mezcle con turnos.
 */
export const finalizarEntrevistaBodySchema = z.object({}).strict()

export type FinalizarEntrevistaBodyInput = z.infer<typeof finalizarEntrevistaBodySchema>
