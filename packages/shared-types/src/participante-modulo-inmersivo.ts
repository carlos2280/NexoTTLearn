// Participante · Modo estudio inmersivo (`/cursos/{slug}/modulo/{moduloId}`).
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/estudio/README.md.
// Contrato del payload runtime que consume la pantalla. El back devuelve TODO
// lo necesario para pintar el modulo + estado runtime del usuario.

import { z } from "zod"
import { codigoEvaluableSchema } from "./admin-cursos"
import { lecturaContenidoSchema } from "./bloque-payloads"
import {
  cursoNivelSchema,
  gradientePresetSchema,
  iconoCursoPresetSchema,
} from "./participante-mis-cursos"

// Estado runtime de un bloque (paridad §8.5 MAESTRO).
export const bloqueRuntimeEstadoSchema = z.enum(["SIN_INTENTAR", "EN_PROGRESO", "COMPLETADO"])
export type BloqueRuntimeEstado = z.infer<typeof bloqueRuntimeEstadoSchema>

// Bloque PARRAFO (unico tipo con render real en S1). El payload reusa el
// schema del admin: el `cuerpo` viene como HTML serializado de Tiptap.
export const bloqueRuntimeParrafoSchema = z.object({
  id: z.string().min(1),
  tipo: z.literal("PARRAFO"),
  titulo: z.string().min(1),
  orden: z.number().int().min(1),
  duracionEstimadaMin: z.number().int().min(0).nullable(),
  estado: bloqueRuntimeEstadoSchema,
  payload: lecturaContenidoSchema,
})
export type BloqueRuntimeParrafo = z.infer<typeof bloqueRuntimeParrafoSchema>

// Placeholder · S1 muestra "Tipo · proximamente". Discriminado por tipo para
// preservar exhaustiveness cuando los siguientes sprints reemplacen variantes.
const bloqueRuntimePlaceholderBaseSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  orden: z.number().int().min(1),
  duracionEstimadaMin: z.number().int().min(0).nullable(),
  estado: bloqueRuntimeEstadoSchema,
  payload: z.unknown(),
})

// CODIGO lleva sub-discriminante `codigoEvaluable` (NINGUNO/PREGUNTAS/TESTS)
// que mapea a las antiguas etiquetas de UI (ejemplo / ejercicio guiado / reto).
const bloqueRuntimeCodigoPlaceholderSchema = bloqueRuntimePlaceholderBaseSchema.extend({
  tipo: z.literal("CODIGO"),
  codigoEvaluable: codigoEvaluableSchema,
})

export const bloqueRuntimeSchema = z.discriminatedUnion("tipo", [
  bloqueRuntimeParrafoSchema,
  bloqueRuntimeCodigoPlaceholderSchema,
  bloqueRuntimePlaceholderBaseSchema.extend({ tipo: z.literal("QUIZ") }),
  bloqueRuntimePlaceholderBaseSchema.extend({ tipo: z.literal("VIDEO") }),
  bloqueRuntimePlaceholderBaseSchema.extend({ tipo: z.literal("RECURSO") }),
  bloqueRuntimePlaceholderBaseSchema.extend({ tipo: z.literal("TIP") }),
])
export type BloqueRuntime = z.infer<typeof bloqueRuntimeSchema>
export type TipoBloqueRuntime = BloqueRuntime["tipo"]

// Clave compuesta para lookup en presets visuales. CODIGO se desdobla por su
// sub-discriminante; el resto se mapea 1:1.
export type BloqueRuntimePresetKey =
  | "PARRAFO"
  | "CODIGO_NINGUNO"
  | "CODIGO_PREGUNTAS"
  | "CODIGO_TESTS"
  | "QUIZ"
  | "VIDEO"
  | "RECURSO"
  | "TIP"

export function presetKeyDeBloque(bloque: BloqueRuntime): BloqueRuntimePresetKey {
  if (bloque.tipo === "CODIGO") {
    return `CODIGO_${bloque.codigoEvaluable}` as const
  }
  return bloque.tipo
}

// Seccion del modulo: agrupa bloques con cabecera propia.
export const seccionInmersivaEstadoSchema = z.enum(["NO_INICIADA", "EN_PROGRESO", "COMPLETADA"])
export type SeccionInmersivaEstado = z.infer<typeof seccionInmersivaEstadoSchema>

export const seccionInmersivaSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  orden: z.number().int().min(1),
  estado: seccionInmersivaEstadoSchema,
  bloques: z.array(bloqueRuntimeSchema).min(1),
})
export type SeccionInmersiva = z.infer<typeof seccionInmersivaSchema>

// Cabecera del curso (subset minimo para chrome inmersivo).
export const moduloInmersivoCursoSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  titulo: z.string().min(1),
  gradiente: gradientePresetSchema,
  icono: iconoCursoPresetSchema,
  nivel: cursoNivelSchema,
  hrefVolver: z.string().min(1),
})
export type ModuloInmersivoCurso = z.infer<typeof moduloInmersivoCursoSchema>

// Cabecera del modulo activo.
export const moduloInmersivoSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  titulo: z.string().min(1),
  posicionLabel: z.string().min(1),
  deadlineIso: z.string().nullable(),
})
export type ModuloInmersivo = z.infer<typeof moduloInmersivoSchema>

// Progreso global del modulo (entero 0..100).
export const moduloInmersivoProgresoSchema = z.object({
  bloquesInteractuados: z.number().int().min(0),
  bloquesTotales: z.number().int().min(1),
  porcentaje: z.number().int().min(0).max(100),
})
export type ModuloInmersivoProgreso = z.infer<typeof moduloInmersivoProgresoSchema>

// Navegacion: el back resuelve "donde aterrizar" y vecinos.
export const moduloInmersivoNavegacionSchema = z.object({
  bloqueInicialId: z.string().min(1),
  siguienteBloqueId: z.string().nullable(),
  anteriorBloqueId: z.string().nullable(),
})
export type ModuloInmersivoNavegacion = z.infer<typeof moduloInmersivoNavegacionSchema>

export const moduloInmersivoResponseSchema = z.object({
  curso: moduloInmersivoCursoSchema,
  modulo: moduloInmersivoSchema,
  secciones: z.array(seccionInmersivaSchema).min(1),
  progreso: moduloInmersivoProgresoSchema,
  navegacion: moduloInmersivoNavegacionSchema,
})
export type ModuloInmersivoResponse = z.infer<typeof moduloInmersivoResponseSchema>
