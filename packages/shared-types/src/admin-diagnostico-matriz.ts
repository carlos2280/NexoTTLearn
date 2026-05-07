import { z } from "zod"

// MAESTRO §7.2 · matriz de evaluacion inicial para el tab "Evaluacion" del
// modulo Diagnostico. Una fila por inscripcion ACTIVA, una columna por area
// declarada del curso. El semaforo se calcula server-side contra el
// puntajeObjetivo de cada CursoArea (umbral del area).
//
// Reglas:
// - Lectura pura: la captura individual usa el endpoint existente
//   `PUT /admin/inscripciones/:inscripcionId/evaluaciones-iniciales/:areaId`.
// - Filtros opcionales: busqueda por nombre/email del participante y filtro
//   "solo sin datos" para enfocar al admin en lo que falta.

export const semaforoCeldaDiagnosticoSchema = z.enum(["verde", "amarillo", "rojo", "vacio"])
export type SemaforoCeldaDiagnostico = z.infer<typeof semaforoCeldaDiagnosticoSchema>

// ─────────────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────────────

export const matrizDiagnosticoQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    soloSinDatos: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => (typeof v === "string" ? v === "true" : v))
      .optional(),
  })
  .strict()
export type MatrizDiagnosticoQuery = z.infer<typeof matrizDiagnosticoQuerySchema>

// ─────────────────────────────────────────────────────────────────
// Estructura de respuesta
// ─────────────────────────────────────────────────────────────────

export const matrizDiagnosticoAreaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  color: z.string(),
  peso: z.number(),
  puntajeObjetivo: z.number().int(),
})
export type MatrizDiagnosticoArea = z.infer<typeof matrizDiagnosticoAreaSchema>

export const matrizDiagnosticoCeldaSchema = z.object({
  areaId: z.string(),
  nota: z.number().int().nullable(),
  semaforo: semaforoCeldaDiagnosticoSchema,
})
export type MatrizDiagnosticoCelda = z.infer<typeof matrizDiagnosticoCeldaSchema>

export const matrizDiagnosticoFilaParticipanteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
})

export const matrizDiagnosticoFilaSchema = z.object({
  inscripcionId: z.string(),
  participante: matrizDiagnosticoFilaParticipanteSchema,
  celdas: z.array(matrizDiagnosticoCeldaSchema),
  cobertura: z.object({
    capturadas: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
})
export type MatrizDiagnosticoFila = z.infer<typeof matrizDiagnosticoFilaSchema>

export const matrizDiagnosticoContadoresSchema = z.object({
  candidatos: z.number().int().min(0),
  conDatosCompletos: z.number().int().min(0),
  celdasCapturadas: z.number().int().min(0),
  celdasTotales: z.number().int().min(0),
})
export type MatrizDiagnosticoContadores = z.infer<typeof matrizDiagnosticoContadoresSchema>

export const matrizDiagnosticoResponseSchema = z.object({
  cursoId: z.string(),
  areas: z.array(matrizDiagnosticoAreaSchema),
  filas: z.array(matrizDiagnosticoFilaSchema),
  contadores: matrizDiagnosticoContadoresSchema,
})
export type MatrizDiagnosticoResponse = z.infer<typeof matrizDiagnosticoResponseSchema>
