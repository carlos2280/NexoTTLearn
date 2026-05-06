import { z } from "zod"
import {
  motivoAjusteSchema,
  notaSchema,
  textoLibreCualitativoSchema,
} from "./admin-centro-revision-shared"

// MAESTRO §10 (proyectos 3 capas), §10.5 (fórmula notaFinal), §12.4
// (acciones admin sobre proyecto), §12.5 (trazabilidad), §17.2 (motivo
// obligatorio), §A25 (flujo evaluación proyecto), §A26 (flujo ajuste
// manual). Iter 9.B.
//
// Diseño:
// - `evaluar` recibe las 3 notas de capa; el servidor calcula notaFinal
//   con los pesos vigentes del MiniProyecto/PT y los persiste como
//   snapshot (pesoCapa*Aplicado).
// - `ajustar` (A26) recibe notaFinal directa + motivo. NO toca notas
//   por capa ni los pesos snapshot. notaFinal puede divergir del cálculo
//   original — eso es justo lo que A26 captura.

// ─────────────────────────────────────────────────────────────────
// Estados y filtros
// ─────────────────────────────────────────────────────────────────

export const estadoEntregaProyectoSchema = z.enum(["ENVIADA", "EN_REVISION", "EVALUADA"])
export type EstadoEntregaProyecto = z.infer<typeof estadoEntregaProyectoSchema>

export const filtroEstadoEntregaProyectoSchema = z.union([
  estadoEntregaProyectoSchema,
  z.literal("all"),
])
export type FiltroEstadoEntregaProyecto = z.infer<typeof filtroEstadoEntregaProyectoSchema>

export const tipoEntregaProyectoSchema = z.enum(["MINI", "TRANSVERSAL"])
export type TipoEntregaProyecto = z.infer<typeof tipoEntregaProyectoSchema>

// ─────────────────────────────────────────────────────────────────
// QUERY · GET /admin/centro-revision/entregas-proyecto
// ─────────────────────────────────────────────────────────────────

export const listarEntregasProyectoAdminQuerySchema = z.object({
  estado: filtroEstadoEntregaProyectoSchema.optional(),
  cursoId: z.string().uuid("cursoId debe ser un UUID valido").optional(),
  moduloId: z.string().uuid("moduloId debe ser un UUID valido").optional(),
  participanteId: z.string().uuid("participanteId debe ser un UUID valido").optional(),
  miniProyectoId: z.string().uuid("miniProyectoId debe ser un UUID valido").optional(),
  transversalId: z.string().uuid("transversalId debe ser un UUID valido").optional(),
  tipo: tipoEntregaProyectoSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListarEntregasProyectoAdminQuery = z.infer<
  typeof listarEntregasProyectoAdminQuerySchema
>

// ─────────────────────────────────────────────────────────────────
// LISTADO
// ─────────────────────────────────────────────────────────────────

const participanteEmbebidoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
})

const cursoEmbebidoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  empresaCliente: z.string(),
})

const cursoEmbebidoConEstadoSchema = cursoEmbebidoSchema.extend({
  estado: z.enum(["BORRADOR", "ACTIVO", "CERRADO"]),
})

const miniProyectoEmbebidoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  enunciado: z.string(),
  moduloId: z.string(),
  moduloTitulo: z.string(),
  pesoCapa1: z.number(),
  pesoCapa2: z.number(),
  pesoCapa3: z.number(),
})

const transversalEmbebidoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  enunciado: z.string(),
  umbralAprobacion: z.number(),
  pesoCapa1: z.number(),
  pesoCapa2: z.number(),
  pesoCapa3: z.number(),
})

export const entregaProyectoListItemAdminSchema = z.object({
  id: z.string(),
  inscripcionId: z.string(),
  tipo: tipoEntregaProyectoSchema,
  miniProyectoId: z.string().nullable(),
  transversalId: z.string().nullable(),
  intento: z.number().int().min(1),
  estado: estadoEntregaProyectoSchema,
  notaFinal: z.number().nullable(),
  ajustadaManual: z.boolean(),
  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),
  participante: participanteEmbebidoSchema,
  curso: cursoEmbebidoSchema,
  // Título del proyecto (mini o transversal según el XOR).
  proyectoTitulo: z.string(),
  moduloId: z.string().nullable(),
  moduloTitulo: z.string().nullable(),
})
export type EntregaProyectoListItemAdmin = z.infer<typeof entregaProyectoListItemAdminSchema>

export const entregaProyectoListAdminResponseSchema = z.object({
  items: z.array(entregaProyectoListItemAdminSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})
export type EntregaProyectoListAdminResponse = z.infer<
  typeof entregaProyectoListAdminResponseSchema
>

// ─────────────────────────────────────────────────────────────────
// DETALLE · una entrega + intentos previos del mismo (participante, proyecto)
// ─────────────────────────────────────────────────────────────────

export const entregaProyectoIntentoPrevioAdminSchema = z.object({
  id: z.string(),
  intento: z.number().int().min(1),
  estado: estadoEntregaProyectoSchema,
  notaFinal: z.number().nullable(),
  ajustadaManual: z.boolean(),
  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),
})
export type EntregaProyectoIntentoPrevioAdmin = z.infer<
  typeof entregaProyectoIntentoPrevioAdminSchema
>

export const entregaProyectoDetalleAdminSchema = z.object({
  id: z.string(),
  inscripcionId: z.string(),
  tipo: tipoEntregaProyectoSchema,
  miniProyectoId: z.string().nullable(),
  transversalId: z.string().nullable(),
  intento: z.number().int().min(1),
  estado: estadoEntregaProyectoSchema,
  urlRepo: z.string(),
  rama: z.string(),

  notaCapa1: z.number().nullable(),
  notaCapa2: z.number().nullable(),
  notaCapa3: z.number().nullable(),
  notaFinal: z.number().nullable(),
  ajustadaManual: z.boolean(),

  pesoCapa1Aplicado: z.number().nullable(),
  pesoCapa2Aplicado: z.number().nullable(),
  pesoCapa3Aplicado: z.number().nullable(),

  // Lo que daría el cálculo de §10.5 con las notas y pesos snapshot
  // que tenemos persistidos. El front lo muestra como "nota_actual"
  // de referencia en el modal A26 (paso 3 del flujo).
  notaCalculadaOriginal: z.number().nullable(),

  fortalezas: z.string().nullable(),
  areasMejora: z.string().nullable(),
  dudasDetectadas: z.string().nullable(),
  transcripcionCapa3: z.string().nullable(),

  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),

  participante: participanteEmbebidoSchema,
  curso: cursoEmbebidoConEstadoSchema,
  inscripcion: z.object({
    id: z.string(),
    estado: z.enum(["ACTIVA", "COMPLETADA", "ABANDONADA", "CERRADO_SIN_COMPLETAR"]),
    tipo: z.enum(["SOLICITUD", "LIBRE"]),
  }),
  miniProyecto: miniProyectoEmbebidoSchema.nullable(),
  transversal: transversalEmbebidoSchema.nullable(),
  intentos: z.array(entregaProyectoIntentoPrevioAdminSchema),
})
export type EntregaProyectoDetalleAdmin = z.infer<typeof entregaProyectoDetalleAdminSchema>

// ─────────────────────────────────────────────────────────────────
// PATCH /:id/evaluar · A25 · EN_REVISION → EVALUADA
// Server calcula notaFinal con pesos vigentes y persiste snapshot.
// ─────────────────────────────────────────────────────────────────

export const evaluarEntregaProyectoAdminInputSchema = z
  .object({
    notaCapa1: notaSchema,
    notaCapa2: notaSchema,
    notaCapa3: notaSchema,
    fortalezas: textoLibreCualitativoSchema.nullish(),
    areasMejora: textoLibreCualitativoSchema.nullish(),
    dudasDetectadas: textoLibreCualitativoSchema.nullish(),
    transcripcionCapa3: textoLibreCualitativoSchema.nullish(),
  })
  .strict()
export type EvaluarEntregaProyectoAdminInput = z.infer<
  typeof evaluarEntregaProyectoAdminInputSchema
>

// ─────────────────────────────────────────────────────────────────
// PATCH /:id/ajustar · A26 · ajuste manual con motivo + notaFinal
// override directo. notaCapa* y pesoCapa*Aplicado quedan inmutables.
// ─────────────────────────────────────────────────────────────────

export const ajustarEntregaProyectoAdminInputSchema = z
  .object({
    notaFinal: notaSchema,
    motivoAjuste: motivoAjusteSchema,
    fortalezas: textoLibreCualitativoSchema.nullish(),
    areasMejora: textoLibreCualitativoSchema.nullish(),
    dudasDetectadas: textoLibreCualitativoSchema.nullish(),
    transcripcionCapa3: textoLibreCualitativoSchema.nullish(),
  })
  .strict()
export type AjustarEntregaProyectoAdminInput = z.infer<
  typeof ajustarEntregaProyectoAdminInputSchema
>
