import { z } from "zod"
import {
  motivoAjusteSchema,
  notaSchema,
  textoLibreCualitativoSchema,
} from "./admin-centro-revision-shared"

// MAESTRO §9 (entregas), §12 (centro de revision admin), §17.2 (motivo
// obligatorio en ajuste manual), §A26 (flujo ajuste manual con motivo).
// Iter 9.A · alcance: SOLO entregas de bloque (EntregaBloque). Las entregas
// de proyecto se cubren en Iter 9.B (ver admin-centro-revision-proyectos).
//
// Reglas:
// - Mutaciones .strict() → claves desconocidas devuelven 400. Sin esto un
//   cliente podria mandar `ajustadaManual=false` en ajustar y bypasear A26.
// - nota: rango [0, 100] inclusive, max 2 decimales (Decimal(5,2) en BD).
// - feedback: opcional, max 4000. Semántica PATCH: undefined preserva,
//   null borra, string vacío tras trim → null (aplicada en el servicio).
// - motivoAjuste: obligatorio, no vacio tras trim, 10–1000 chars.

const feedbackSchema = textoLibreCualitativoSchema

// ─────────────────────────────────────────────────────────────────
// Estados que el admin filtra
// ─────────────────────────────────────────────────────────────────

export const estadoEntregaBloqueSchema = z.enum([
  "ENVIADA",
  "EVALUADA_AUTOMATICAMENTE",
  "PENDIENTE_REVISION",
  "EVALUADA",
])
export type EstadoEntregaBloque = z.infer<typeof estadoEntregaBloqueSchema>

// El listado por defecto trae solo PENDIENTE_REVISION (ver service). El
// admin puede pedir explicitamente otro estado o `all` para no filtrar.
export const filtroEstadoEntregaBloqueSchema = z.union([
  estadoEntregaBloqueSchema,
  z.literal("all"),
])
export type FiltroEstadoEntregaBloque = z.infer<typeof filtroEstadoEntregaBloqueSchema>

// ─────────────────────────────────────────────────────────────────
// QUERY · GET /admin/centro-revision/entregas-bloque
// ─────────────────────────────────────────────────────────────────

export const listarEntregasBloqueAdminQuerySchema = z.object({
  estado: filtroEstadoEntregaBloqueSchema.optional(),
  cursoId: z.string().uuid("cursoId debe ser un UUID valido").optional(),
  moduloId: z.string().uuid("moduloId debe ser un UUID valido").optional(),
  participanteId: z.string().uuid("participanteId debe ser un UUID valido").optional(),
  bloqueId: z.string().uuid("bloqueId debe ser un UUID valido").optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListarEntregasBloqueAdminQuery = z.infer<typeof listarEntregasBloqueAdminQuerySchema>

// ─────────────────────────────────────────────────────────────────
// LISTADO · item liviano para la cola
// ─────────────────────────────────────────────────────────────────

const tipoBloqueEntregaSchema = z.enum(["PARRAFO", "TIP", "VIDEO", "RECURSO", "CODIGO", "QUIZ"])
const codigoEvaluableEntregaSchema = z.enum(["NINGUNO", "PREGUNTAS", "TESTS"])

export const entregaBloqueListItemAdminSchema = z.object({
  id: z.string(),
  inscripcionId: z.string(),
  bloqueId: z.string(),
  intento: z.number().int().min(1),
  estado: estadoEntregaBloqueSchema,
  nota: z.number().nullable(),
  ajustadaManual: z.boolean(),
  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),
  participante: z.object({
    id: z.string(),
    nombre: z.string(),
    apellido: z.string(),
    email: z.string(),
  }),
  bloque: z.object({
    id: z.string(),
    tipo: tipoBloqueEntregaSchema,
    codigoEvaluable: codigoEvaluableEntregaSchema.nullable(),
    seccionTitulo: z.string(),
    moduloId: z.string(),
    moduloTitulo: z.string(),
  }),
  curso: z.object({
    id: z.string(),
    titulo: z.string(),
    empresaCliente: z.string(),
  }),
})
export type EntregaBloqueListItemAdmin = z.infer<typeof entregaBloqueListItemAdminSchema>

export const entregaBloqueListAdminResponseSchema = z.object({
  items: z.array(entregaBloqueListItemAdminSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})
export type EntregaBloqueListAdminResponse = z.infer<typeof entregaBloqueListAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// DETALLE · una entrega + intentos previos del mismo (participante, bloque)
// ─────────────────────────────────────────────────────────────────

export const entregaBloqueIntentoPrevioAdminSchema = z.object({
  id: z.string(),
  intento: z.number().int().min(1),
  estado: estadoEntregaBloqueSchema,
  nota: z.number().nullable(),
  ajustadaManual: z.boolean(),
  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),
})
export type EntregaBloqueIntentoPrevioAdmin = z.infer<typeof entregaBloqueIntentoPrevioAdminSchema>

export const entregaBloqueDetalleAdminSchema = z.object({
  id: z.string(),
  inscripcionId: z.string(),
  bloqueId: z.string(),
  intento: z.number().int().min(1),
  estado: estadoEntregaBloqueSchema,
  nota: z.number().nullable(),
  feedback: z.string().nullable(),
  ajustadaManual: z.boolean(),
  evaluadaPorId: z.string().nullable(),
  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),
  contenido: z.unknown(),
  participante: z.object({
    id: z.string(),
    nombre: z.string(),
    apellido: z.string(),
    email: z.string(),
  }),
  bloque: z.object({
    id: z.string(),
    tipo: tipoBloqueEntregaSchema,
    codigoEvaluable: codigoEvaluableEntregaSchema.nullable(),
    payload: z.unknown(),
    seccionId: z.string(),
    seccionTitulo: z.string(),
    moduloId: z.string(),
    moduloTitulo: z.string(),
  }),
  curso: z.object({
    id: z.string(),
    titulo: z.string(),
    empresaCliente: z.string(),
    estado: z.enum(["BORRADOR", "ACTIVO", "CERRADO"]),
  }),
  inscripcion: z.object({
    id: z.string(),
    estado: z.enum(["ACTIVA", "COMPLETADA", "ABANDONADA", "CERRADO_SIN_COMPLETAR"]),
    tipo: z.enum(["SOLICITUD", "LIBRE"]),
  }),
  // Intentos del mismo (participante, bloque) — incluye al actual.
  // T05 · I1 · "mejor intento" se calcula sobre esta lista en el cliente.
  intentos: z.array(entregaBloqueIntentoPrevioAdminSchema),
})
export type EntregaBloqueDetalleAdmin = z.infer<typeof entregaBloqueDetalleAdminSchema>

// ─────────────────────────────────────────────────────────────────
// PATCH /:id/evaluar · transicion PENDIENTE_REVISION → EVALUADA
// MAESTRO §12.3 · "Marcar como EVALUADA" tras revisar.
// ─────────────────────────────────────────────────────────────────

export const evaluarEntregaBloqueAdminInputSchema = z
  .object({
    nota: notaSchema,
    feedback: feedbackSchema.nullish(),
  })
  .strict()
export type EvaluarEntregaBloqueAdminInput = z.infer<typeof evaluarEntregaBloqueAdminInputSchema>

// ─────────────────────────────────────────────────────────────────
// PATCH /:id/ajustar · A26 · sobrescritura con motivo obligatorio
// MAESTRO §A26 · ajuste manual. Aplica a EVALUADA o EVALUADA_AUTOMATICAMENTE.
// ─────────────────────────────────────────────────────────────────

export const ajustarEntregaBloqueAdminInputSchema = z
  .object({
    nota: notaSchema,
    feedback: feedbackSchema.nullish(),
    motivoAjuste: motivoAjusteSchema,
  })
  .strict()
export type AjustarEntregaBloqueAdminInput = z.infer<typeof ajustarEntregaBloqueAdminInputSchema>
