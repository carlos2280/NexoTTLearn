import { z } from "zod"

// MAESTRO §7.3 + §7.7 · asignaciones de modulos por inscripcion para el tab
// "Asignacion" del modulo Diagnostico. Las sugerencias se calculan en runtime
// segun la formula brecha = max(0, puntajeObjetivoArea - notaInicial), con
// umbral configurable curso.umbralBrechaNoCumple (default 10):
//   - sin nota                       → SIN_DATO   (sin sugerencia)
//   - brecha = 0                     → CUMPLE     (no asignar)
//   - 0 < brecha < umbralBrechaNoCumple → CERCA   → RECOMENDADO
//   - brecha >= umbralBrechaNoCumple → NO_CUMPLE  → OBLIGATORIO
//
// Las confirmadas se persisten en `Asignacion`. Las sugerencias NO.

export const tipoAsignacionSchema = z.enum(["OBLIGATORIO", "RECOMENDADO", "OPCIONAL"])
export type TipoAsignacion = z.infer<typeof tipoAsignacionSchema>

export const motivoSugerenciaSchema = z.enum(["NO_CUMPLE", "CERCA", "SIN_DATO"])
export type MotivoSugerencia = z.infer<typeof motivoSugerenciaSchema>

// ─────────────────────────────────────────────────────────────────
// Datos compartidos (lectura)
// ─────────────────────────────────────────────────────────────────

export const asignacionAreaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  color: z.string(),
  puntajeObjetivo: z.number().int(),
})
export type AsignacionArea = z.infer<typeof asignacionAreaSchema>

export const asignacionModuloSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  orden: z.number().int(),
  areaId: z.string(),
})
export type AsignacionModulo = z.infer<typeof asignacionModuloSchema>

export const sugerenciaModuloSchema = z.object({
  moduloId: z.string(),
  areaId: z.string(),
  tipo: tipoAsignacionSchema,
  motivo: motivoSugerenciaSchema,
})
export type SugerenciaModulo = z.infer<typeof sugerenciaModuloSchema>

export const asignacionConfirmadaSchema = z.object({
  moduloId: z.string(),
  tipo: tipoAsignacionSchema,
  asignadaAt: z.string(),
  modificadaAt: z.string().nullable(),
})
export type AsignacionConfirmada = z.infer<typeof asignacionConfirmadaSchema>

export const cumpleAreaSchema = z.object({
  areaId: z.string(),
  areaNombre: z.string(),
  nota: z.number().int(),
})
export type CumpleArea = z.infer<typeof cumpleAreaSchema>

export const candidatoAsignacionParticipanteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
})

export const candidatoAsignacionSchema = z.object({
  inscripcionId: z.string(),
  participante: candidatoAsignacionParticipanteSchema,
  tieneEvaluacion: z.boolean(),
  sugerencias: z.array(sugerenciaModuloSchema),
  confirmadas: z.array(asignacionConfirmadaSchema),
  cumple: z.array(cumpleAreaSchema),
})
export type CandidatoAsignacion = z.infer<typeof candidatoAsignacionSchema>

// ─────────────────────────────────────────────────────────────────
// GET /admin/cursos/:cursoId/diagnostico/asignaciones
// ─────────────────────────────────────────────────────────────────

export const matrizAsignacionesQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
export type MatrizAsignacionesQuery = z.infer<typeof matrizAsignacionesQuerySchema>

export const matrizAsignacionesContadoresSchema = z.object({
  candidatos: z.number().int().min(0),
  conSugerencia: z.number().int().min(0),
  cumplenTodo: z.number().int().min(0),
  sinEvaluacion: z.number().int().min(0),
  yaConfirmados: z.number().int().min(0),
})
export type MatrizAsignacionesContadores = z.infer<typeof matrizAsignacionesContadoresSchema>

export const matrizAsignacionesResponseSchema = z.object({
  cursoId: z.string(),
  umbralBrechaNoCumple: z.number().int(),
  areas: z.array(asignacionAreaSchema),
  modulos: z.array(asignacionModuloSchema),
  candidatos: z.array(candidatoAsignacionSchema),
  contadores: matrizAsignacionesContadoresSchema,
})
export type MatrizAsignacionesResponse = z.infer<typeof matrizAsignacionesResponseSchema>

// ─────────────────────────────────────────────────────────────────
// GET /admin/inscripciones/:id/asignaciones
// ─────────────────────────────────────────────────────────────────

export const asignacionesInscripcionResponseSchema = z.object({
  inscripcionId: z.string(),
  cursoId: z.string(),
  tieneEvaluacion: z.boolean(),
  sugerencias: z.array(sugerenciaModuloSchema),
  confirmadas: z.array(asignacionConfirmadaSchema),
})
export type AsignacionesInscripcionResponse = z.infer<typeof asignacionesInscripcionResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Mutaciones
// ─────────────────────────────────────────────────────────────────

export const asignacionInputSchema = z
  .object({
    moduloId: z.string().uuid(),
    tipo: tipoAsignacionSchema,
  })
  .strict()
export type AsignacionInput = z.infer<typeof asignacionInputSchema>

export const reemplazarAsignacionesInputSchema = z
  .object({
    asignaciones: z.array(asignacionInputSchema).max(200),
  })
  .strict()
export type ReemplazarAsignacionesInput = z.infer<typeof reemplazarAsignacionesInputSchema>

export const cambiarTipoAsignacionInputSchema = z.object({ tipo: tipoAsignacionSchema }).strict()
export type CambiarTipoAsignacionInput = z.infer<typeof cambiarTipoAsignacionInputSchema>

export const asignacionDeleteResponseSchema = z.object({
  tipo: z.literal("ELIMINADA"),
  inscripcionId: z.string(),
  moduloId: z.string(),
})
export type AsignacionDeleteResponse = z.infer<typeof asignacionDeleteResponseSchema>

export const confirmarLoteItemSchema = z
  .object({
    inscripcionId: z.string().uuid(),
    asignaciones: z.array(asignacionInputSchema).max(50),
  })
  .strict()
export type ConfirmarLoteItem = z.infer<typeof confirmarLoteItemSchema>

export const confirmarLoteInputSchema = z
  .object({
    items: z.array(confirmarLoteItemSchema).min(1).max(200),
  })
  .strict()
export type ConfirmarLoteInput = z.infer<typeof confirmarLoteInputSchema>

export const confirmarLoteResumenSchema = z.object({
  candidatosAfectados: z.number().int().min(0),
  asignacionesCreadas: z.number().int().min(0),
  asignacionesActualizadas: z.number().int().min(0),
  asignacionesEliminadas: z.number().int().min(0),
  obligatorios: z.number().int().min(0),
  recomendados: z.number().int().min(0),
  opcionales: z.number().int().min(0),
})
export type ConfirmarLoteResumen = z.infer<typeof confirmarLoteResumenSchema>

export const confirmarLoteResponseSchema = z.object({
  ok: z.literal(true),
  resumen: confirmarLoteResumenSchema,
})
export type ConfirmarLoteResponse = z.infer<typeof confirmarLoteResponseSchema>
