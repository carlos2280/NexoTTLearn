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
  // Nota inicial (EvaluacionInicial.puntaje). En tab "inicial" coincide con
  // `nota`. En tab "actual" puede ser null si no hay diagnóstico capturado.
  notaInicial: z.number().int().min(0).max(100).nullable(),
  semaforo: semaforoCeldaSchema,
})
export type MatrizCelda = z.infer<typeof matrizCeldaSchema>

export const trayectoriaResumenFilaSchema = z.object({
  // Promedio(actual) - Promedio(inicial) sobre áreas con ambos valores.
  deltaPromedio: z.number(),
})
export type TrayectoriaResumenFila = z.infer<typeof trayectoriaResumenFilaSchema>

export const matrizFilaSchema = z.object({
  inscripcionId: z.string().uuid(),
  participante: matrizParticipanteSchema,
  estadoSeguimiento: estadoSeguimientoSchema,
  celdas: z.array(matrizCeldaSchema),
  cobertura: z.number(),
  // Solo presente en tab "actual" cuando hay al menos un par (inicial, actual).
  trayectoriaResumen: trayectoriaResumenFilaSchema.optional(),
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

// ─────────────────────────────────────────────────────────────────
// Cohorte · charts agregados (línea de tiempo, barras por área, donut)
// ─────────────────────────────────────────────────────────────────
//
// Sin snapshots históricos en MVP: la serie devuelve siempre 2 puntos
// (Inicial · usando notaInicial; Hoy · usando nota actual). Cuando aterrice
// el job de snapshots se enriquece con puntos intermedios.

export const cohorteSeriePuntoSchema = z.object({
  etiqueta: z.string(),
  valor: z.number(),
})
export type CohorteSeriePunto = z.infer<typeof cohorteSeriePuntoSchema>

export const cohorteSerieResponseSchema = z.object({
  puntos: z.array(cohorteSeriePuntoSchema),
})
export type CohorteSerieResponse = z.infer<typeof cohorteSerieResponseSchema>

export const cohorteAreaPromedioSchema = z.object({
  areaId: z.string().uuid(),
  nombre: z.string(),
  promedio: z.number(),
  objetivo: z.number(),
})
export type CohorteAreaPromedio = z.infer<typeof cohorteAreaPromedioSchema>

export const cohorteAreasResponseSchema = z.object({
  areas: z.array(cohorteAreaPromedioSchema),
})
export type CohorteAreasResponse = z.infer<typeof cohorteAreasResponseSchema>

export const cohorteDistribucionItemSchema = z.object({
  estado: estadoSeguimientoSchema,
  cantidad: z.number().int().min(0),
})
export type CohorteDistribucionItem = z.infer<typeof cohorteDistribucionItemSchema>

export const cohorteDistribucionResponseSchema = z.object({
  distribucion: z.array(cohorteDistribucionItemSchema),
})
export type CohorteDistribucionResponse = z.infer<typeof cohorteDistribucionResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Evolución persona × área (drawer)
// ─────────────────────────────────────────────────────────────────
//
// Serie temporal: punto 0 = EvaluacionInicial (si existe) con
// hito="Diagnóstico inicial". Los siguientes puntos son entregas de
// bloque del área (EntregaBloque), ordenadas por enviadaAt asc, con
// hito = título del bloque.
//
// Proyección: regresión lineal simple sobre los últimos N=5 puntos.
// Si pendiente <= 0 o hay menos de 2 puntos válidos →
// { diasAlObjetivo: null, valorEstimado: null }.
// valorEstimado: nota proyectada a 30 días (capeada a [0, 100]).
// diasAlObjetivo: días hasta cruzar el umbralArea (0 si ya está sobre).

export const celdaEvolucionPuntoSchema = z.object({
  fecha: z.string().datetime(),
  valor: z.number(),
  hito: z.string().nullable(),
})
export type CeldaEvolucionPunto = z.infer<typeof celdaEvolucionPuntoSchema>

export const celdaEvolucionProyeccionSchema = z.object({
  diasAlObjetivo: z.number().int().min(0).nullable(),
  valorEstimado: z.number().nullable(),
})
export type CeldaEvolucionProyeccion = z.infer<typeof celdaEvolucionProyeccionSchema>

export const celdaEvolucionResponseSchema = z.object({
  puntos: z.array(celdaEvolucionPuntoSchema),
  proyeccion: celdaEvolucionProyeccionSchema,
})
export type CeldaEvolucionResponse = z.infer<typeof celdaEvolucionResponseSchema>
