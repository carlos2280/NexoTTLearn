// Iter 10 · MAESTRO §13.1-13.6, A29 · contratos read-only para
// matriz/KPIs/celda de la sección admin de seguimiento del curso.
//
// Decisiones cerradas:
//   D-10.1 cálculo en vivo via RecalculoService.snapshotAgregadosPorCurso.
//   D-10.3 estados Apto/EnRuta/EnRiesgo/Completado.
//   D-10.6 semáforo verde/amarillo/rojo/vacio según brecha al umbralArea.
//   D-10.7 cobertura ponderada por inscripción.

import { z } from "zod"

// ─────────────────────────────────────────────────────────────────
// Enums comunes
// ─────────────────────────────────────────────────────────────────

export const seguimientoTabSchema = z.enum(["inicial", "actual"])
export type SeguimientoTab = z.infer<typeof seguimientoTabSchema>

export const estadoSeguimientoSchema = z.enum(["Apto", "EnRuta", "EnRiesgo", "Completado"])
export type EstadoSeguimiento = z.infer<typeof estadoSeguimientoSchema>

export const filtroEstadoSeguimientoSchema = z.enum([
  "Apto",
  "EnRuta",
  "EnRiesgo",
  "Completado",
  "all",
])
export type FiltroEstadoSeguimiento = z.infer<typeof filtroEstadoSeguimientoSchema>

export const semaforoCeldaSchema = z.enum(["verde", "amarillo", "rojo", "vacio"])
export type SemaforoCelda = z.infer<typeof semaforoCeldaSchema>

// ─────────────────────────────────────────────────────────────────
// Query schemas (con coerce sobre query params)
// ─────────────────────────────────────────────────────────────────

export const seguimientoTabQuerySchema = z
  .object({
    tab: seguimientoTabSchema.default("actual"),
  })
  .strict()
export type SeguimientoTabQuery = z.infer<typeof seguimientoTabQuerySchema>

export const seguimientoMatrizQuerySchema = z
  .object({
    tab: seguimientoTabSchema.default("actual"),
    estado: filtroEstadoSeguimientoSchema.optional(),
    search: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
export type SeguimientoMatrizQuery = z.infer<typeof seguimientoMatrizQuerySchema>

// ─────────────────────────────────────────────────────────────────
// E1 · Matriz
// ─────────────────────────────────────────────────────────────────

export const matrizAreaHeaderSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  peso: z.number(),
  umbral: z.number(),
})
export type MatrizAreaHeader = z.infer<typeof matrizAreaHeaderSchema>

export const matrizParticipanteSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
})
export type MatrizParticipante = z.infer<typeof matrizParticipanteSchema>

export const matrizCeldaSchema = z.object({
  areaId: z.string().uuid(),
  nota: z.number().nullable(),
  semaforo: semaforoCeldaSchema,
})
export type MatrizCelda = z.infer<typeof matrizCeldaSchema>

export const matrizFilaSchema = z.object({
  inscripcionId: z.string().uuid(),
  participante: matrizParticipanteSchema,
  estadoSeguimiento: estadoSeguimientoSchema,
  celdas: z.array(matrizCeldaSchema),
  cobertura: z.number(),
})
export type MatrizFila = z.infer<typeof matrizFilaSchema>

export const matrizCursoResponseSchema = z.object({
  cursoId: z.string().uuid(),
  tab: seguimientoTabSchema,
  areas: z.array(matrizAreaHeaderSchema),
  filas: z.array(matrizFilaSchema),
})
export type MatrizCursoResponse = z.infer<typeof matrizCursoResponseSchema>

// ─────────────────────────────────────────────────────────────────
// E2 · KPIs
// ─────────────────────────────────────────────────────────────────

export const kpisCursoActualSchema = z.object({
  tab: z.literal("actual"),
  cumplimientoPct: z.number(),
  enRiesgo: z.number().int(),
  aptosEntrevista: z.number().int(),
  completados: z.number().int(),
})
export type KpisCursoActual = z.infer<typeof kpisCursoActualSchema>

export const kpisCursoInicialSchema = z.object({
  tab: z.literal("inicial"),
  diagnosticados: z.number().int(),
  sinDiagnostico: z.number().int(),
  areasConBrecha: z.number().int(),
  cumplimientoPromedioInicial: z.number(),
})
export type KpisCursoInicial = z.infer<typeof kpisCursoInicialSchema>

export const kpisCursoResponseSchema = z.discriminatedUnion("tab", [
  kpisCursoActualSchema,
  kpisCursoInicialSchema,
])
export type KpisCursoResponse = z.infer<typeof kpisCursoResponseSchema>

// ─────────────────────────────────────────────────────────────────
// E3 · Celda detalle
// ─────────────────────────────────────────────────────────────────

export const celdaInicialDetalleSchema = z.object({
  tab: z.literal("inicial"),
  nota: z.number().nullable(),
  observaciones: z.string().nullable(),
  capturadaPor: z
    .object({ id: z.string().uuid(), nombre: z.string(), apellido: z.string() })
    .nullable(),
  capturadaAt: z.string().nullable(),
  asignacionSugerida: z.enum(["OBLIGATORIO", "RECOMENDADO", "OPCIONAL"]).nullable(),
  asignacionConfirmada: z.enum(["OBLIGATORIO", "RECOMENDADO", "OPCIONAL"]).nullable(),
})
export type CeldaInicialDetalle = z.infer<typeof celdaInicialDetalleSchema>

export const celdaActualModuloSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string(),
  nota: z.number().nullable(),
  estado: z.enum(["NO_INICIADO", "EN_PROGRESO", "COMPLETADO"]),
})
export type CeldaActualModulo = z.infer<typeof celdaActualModuloSchema>

export const celdaActualEntregaRecienteSchema = z.object({
  id: z.string().uuid(),
  bloqueId: z.string().uuid().nullable(),
  miniProyectoId: z.string().uuid().nullable(),
  nota: z.number().nullable(),
  enviadaAt: z.string(),
  estado: z.string(),
})
export type CeldaActualEntregaReciente = z.infer<typeof celdaActualEntregaRecienteSchema>

export const celdaActualDetalleSchema = z.object({
  tab: z.literal("actual"),
  notaArea: z.number().nullable(),
  modulosArea: z.array(celdaActualModuloSchema),
  entregasRecientes: z.array(celdaActualEntregaRecienteSchema),
  alertas: z.array(z.string()),
})
export type CeldaActualDetalle = z.infer<typeof celdaActualDetalleSchema>

export const celdaDetalleResponseSchema = z.discriminatedUnion("tab", [
  celdaInicialDetalleSchema,
  celdaActualDetalleSchema,
])
export type CeldaDetalleResponse = z.infer<typeof celdaDetalleResponseSchema>
