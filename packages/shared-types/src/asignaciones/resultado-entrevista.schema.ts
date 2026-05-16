/**
 * Body de `PATCH /api/v1/asignaciones/:asignacionId/resultado-entrevista-cliente`
 * (D58, Slice 6 P6c). Registra el resultado real con el cliente externo tras el
 * cierre del caso. NO afecta a la aptitud calculada (`estadoAsignado`); alimenta
 * el reporte de eficacia (cap. 12.6).
 *
 * Aplica solo a asignaciones con `rol=ASIGNADO` y `estadoAsignado ∈ {APTO, NO_APTO}`.
 * El service rechaza con 422 cualquier otro rol/estado. El CHECK `chk_asig_resultado_solo_asignado`
 * en BD es el guard de ultima instancia.
 *
 * `fechaEntrevistaCliente` es una fecha del calendario (sin hora). Llega como
 * literal `YYYY-MM-DD`; Zod la convierte a `Date` con `z.coerce.date()` previa
 * validacion de formato para evitar aceptar strings ambiguos como `2026-15-99`.
 */

import { z } from "zod"
import { resultadoEntrevistaClienteSchema } from "./asignacion.types"

const fechaIsoDiaRegex = /^\d{4}-\d{2}-\d{2}$/

// biome-ignore lint/nursery/noSecrets: mensaje de validacion en espanol (alta entropia, falso positivo del detector).
const FORMATO_INVALIDO_MSG = "fechaEntrevistaCliente debe tener formato YYYY-MM-DD"
// biome-ignore lint/nursery/noSecrets: mensaje de validacion en espanol (alta entropia, falso positivo del detector).
const FECHA_INVALIDA_MSG = "fechaEntrevistaCliente no es una fecha valida"

const fechaEntrevistaClienteSchema = z
  .string()
  .regex(fechaIsoDiaRegex, FORMATO_INVALIDO_MSG)
  .refine((s) => !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime()), {
    message: FECHA_INVALIDA_MSG,
  })

export const patchResultadoEntrevistaRequestSchema = z
  .object({
    resultadoEntrevistaCliente: resultadoEntrevistaClienteSchema,
    observacionesCliente: z.string().trim().max(2000).optional(),
    fechaEntrevistaCliente: fechaEntrevistaClienteSchema.optional(),
  })
  .strict()

export type PatchResultadoEntrevistaRequest = z.infer<typeof patchResultadoEntrevistaRequestSchema>
