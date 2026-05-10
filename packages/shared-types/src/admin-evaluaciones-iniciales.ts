import { z } from "zod"

// MAESTRO §7.2 · DTOs y tipos para captura A18 de Evaluacion Inicial.
// Flujo manual uno-a-uno por (Inscripcion, Area). El flujo masivo Excel (A19)
// queda fuera de este modulo; se modelara aparte cuando se implemente.
//
// Reglas:
// - Mutaciones .strict() → claves desconocidas devuelven 400 (no se descartan
//   en silencio, ver feedback `feedback_zod_strict_dtos`).
// - puntaje: entero 0–100 inclusive (mismo rango que MAESTRO §7.2 y check
//   constraint I5 en INVARIANTES-DB).
// - observaciones: opcional. MAESTRO no fija limite explicito; se usa 2000
//   por consistencia con descripcion de curso.

const PUNTAJE_MIN = 0
const PUNTAJE_MAX = 100
const OBSERVACIONES_MAX = 2000

const puntajeSchema = z
  .number()
  .int("El puntaje debe ser un numero entero")
  .min(PUNTAJE_MIN, "El puntaje debe ser >= 0")
  .max(PUNTAJE_MAX, "El puntaje debe ser <= 100")

const observacionesSchema = z
  .string()
  .trim()
  .max(OBSERVACIONES_MAX, "Las observaciones no pueden exceder 2000 caracteres")

// ─────────────────────────────────────────────────────────────────
// PUT (upsert) · crea o actualiza la captura para (inscripcion, area)
// ─────────────────────────────────────────────────────────────────

export const upsertEvaluacionInicialAdminInputSchema = z
  .object({
    puntaje: puntajeSchema,
    observaciones: observacionesSchema.nullish(),
  })
  .strict()
export type UpsertEvaluacionInicialAdminInput = z.infer<
  typeof upsertEvaluacionInicialAdminInputSchema
>

// ─────────────────────────────────────────────────────────────────
// PATCH · actualizacion parcial. Al menos un campo requerido.
// ─────────────────────────────────────────────────────────────────

export const actualizarEvaluacionInicialAdminInputSchema = z
  .object({
    puntaje: puntajeSchema,
    observaciones: observacionesSchema.nullable(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Al menos un campo es requerido" })
export type ActualizarEvaluacionInicialAdminInput = z.infer<
  typeof actualizarEvaluacionInicialAdminInputSchema
>

// ─────────────────────────────────────────────────────────────────
// LECTURA · detalle de una captura
// ─────────────────────────────────────────────────────────────────

export const evaluacionInicialDetalleAdminSchema = z.object({
  id: z.string(),
  inscripcionId: z.string(),
  areaId: z.string(),
  areaNombre: z.string(),
  puntaje: z.number().int(),
  observaciones: z.string().nullable(),
  capturadaPorId: z.string(),
  capturadaAt: z.string(),
  updatedAt: z.string(),
})
export type EvaluacionInicialDetalleAdmin = z.infer<typeof evaluacionInicialDetalleAdminSchema>

// ─────────────────────────────────────────────────────────────────
// LECTURA · listado por inscripcion
// ─────────────────────────────────────────────────────────────────

export const evaluacionInicialListAdminResponseSchema = z.object({
  items: z.array(evaluacionInicialDetalleAdminSchema),
})
export type EvaluacionInicialListAdminResponse = z.infer<
  typeof evaluacionInicialListAdminResponseSchema
>

// ─────────────────────────────────────────────────────────────────
// DELETE · respuesta
// ─────────────────────────────────────────────────────────────────

export const evaluacionInicialDeleteAdminResponseSchema = z.object({
  tipo: z.literal("ELIMINADO"),
  id: z.string(),
})
export type EvaluacionInicialDeleteAdminResponse = z.infer<
  typeof evaluacionInicialDeleteAdminResponseSchema
>
