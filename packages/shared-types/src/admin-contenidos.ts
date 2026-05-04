import { z } from "zod"
import { tipoContenidoSchema } from "./admin-secciones"

// ─────────────────────────────────────────────────────────────────
// Payload polimorfico por tipo de contenido (sprint 2 / F4)
//
// Las definiciones siguen DOCUMENTOS/NEXOTT-LEARN/ANALISIS/03-ESTRUCTURA-CONTENIDO.md.
// Reglas de tolerancia para F4: el admin debe poder crear bloques con payload
// minimo (mostly defaults) para empezar a editar. Por eso casi todos los strings
// permiten vacio y los arrays tienen default []. La validacion estricta de
// "el cuerpo no puede estar vacio" se aplica al PUBLICAR (no en F4).
// ─────────────────────────────────────────────────────────────────

const nivelDificultadBasicoSchema = z.enum(["basico", "intermedio", "avanzado"])
export type NivelDificultadBasico = z.infer<typeof nivelDificultadBasicoSchema>

const nivelDificultadAvanzadoSchema = z.enum(["basico", "intermedio", "avanzado", "experto"])
export type NivelDificultadAvanzado = z.infer<typeof nivelDificultadAvanzadoSchema>

// Metadata base — todos los tipos pueden llevar duracionEstimada en minutos.
// Cada tipo extiende esta base con campos especificos opcionales.
const metadataBaseSchema = z
  .object({
    duracionEstimada: z.number().int().min(0).optional(),
  })
  .passthrough()

// ─────────────────────────────────────────────────────────────────
// LECTURA
// ─────────────────────────────────────────────────────────────────

export const lecturaContenidoSchema = z.object({
  tipo: z.literal("LECTURA"),
  contenido: z.object({
    cuerpo: z.string(),
  }),
  metadata: metadataBaseSchema
    .extend({
      nivel: nivelDificultadBasicoSchema.optional(),
    })
    .optional(),
})
export type LecturaContenido = z.infer<typeof lecturaContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// VIDEO
// ─────────────────────────────────────────────────────────────────

const proveedorVideoSchema = z.enum(["youtube", "vimeo", "interno"])
export type ProveedorVideo = z.infer<typeof proveedorVideoSchema>

export const videoContenidoSchema = z.object({
  tipo: z.literal("VIDEO"),
  contenido: z.object({
    // Permite vacio al crear: en publicacion se exige url valida.
    url: z.string(),
    proveedor: proveedorVideoSchema,
    duracion: z.number().int().min(0).optional(),
    transcripcion: z.string().optional(),
  }),
  metadata: metadataBaseSchema.optional(),
})
export type VideoContenido = z.infer<typeof videoContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// RECURSO
// ─────────────────────────────────────────────────────────────────

const tipoRecursoSchema = z.enum(["pdf", "link", "archivo"])
export type TipoRecurso = z.infer<typeof tipoRecursoSchema>

export const recursoContenidoSchema = z.object({
  tipo: z.literal("RECURSO"),
  contenido: z.object({
    tipoRecurso: tipoRecursoSchema,
    url: z.string(),
    descripcion: z.string().optional(),
    tamano: z.number().int().min(0).optional(),
  }),
  metadata: metadataBaseSchema.optional(),
})
export type RecursoContenido = z.infer<typeof recursoContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// EJEMPLO_CODIGO
// ─────────────────────────────────────────────────────────────────

export const preguntaComprensionSchema = z.object({
  pregunta: z.string(),
  respuestaEsperada: z.string(),
})
export type PreguntaComprension = z.infer<typeof preguntaComprensionSchema>

export const ejemploCodigoContenidoSchema = z.object({
  tipo: z.literal("EJEMPLO_CODIGO"),
  contenido: z.object({
    explicacion: z.string(),
    lenguaje: z.string(),
    codigo: z.string(),
    esInteractivo: z.boolean().default(false),
    preguntasComprension: z.array(preguntaComprensionSchema).default([]),
  }),
  metadata: metadataBaseSchema
    .extend({
      dificultad: nivelDificultadAvanzadoSchema.optional(),
    })
    .optional(),
})
export type EjemploCodigoContenido = z.infer<typeof ejemploCodigoContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// EJERCICIO
// ─────────────────────────────────────────────────────────────────

const modoEjercicioSchema = z.enum(["guiado", "reto"])
export type ModoEjercicio = z.infer<typeof modoEjercicioSchema>

const lenguajeEjercicioSchema = z.enum(["python", "javascript", "typescript", "react"])
export type LenguajeEjercicio = z.infer<typeof lenguajeEjercicioSchema>

export const archivoInicialSchema = z.object({
  path: z.string(),
  content: z.string(),
  readOnly: z.boolean(),
})
export type ArchivoInicial = z.infer<typeof archivoInicialSchema>

export const testEjercicioSchema = z.object({
  nombre: z.string(),
  codigo: z.string(),
})
export type TestEjercicio = z.infer<typeof testEjercicioSchema>

// Los campos condicionales por modo (enunciado/contexto/etc) se declaran
// opcionales en el schema. F4 NO los valida cruzados con el modo — eso vive
// en la regla de publicacion. Si el cliente envia campos del otro modo, el
// schema los acepta (no estorban) pero la UI debe ignorarlos.
export const ejercicioContenidoSchema = z.object({
  tipo: z.literal("EJERCICIO"),
  contenido: z.object({
    modo: modoEjercicioSchema,
    lenguaje: lenguajeEjercicioSchema,
    archivosIniciales: z.array(archivoInicialSchema).default([]),
    tests: z.array(testEjercicioSchema).default([]),
    enunciado: z.string().optional(),
    solucionReferencia: z.string().optional(),
    pistas: z.array(z.string()).default([]),
    contexto: z.string().optional(),
    objetivo: z.string().optional(),
    restricciones: z.array(z.string()).default([]),
    criteriosEvaluacion: z.array(z.string()).default([]),
  }),
  metadata: metadataBaseSchema
    .extend({
      intentosPermitidos: z.number().int().min(1).default(3).optional(),
      dificultad: nivelDificultadAvanzadoSchema.optional(),
    })
    .optional(),
})
export type EjercicioContenido = z.infer<typeof ejercicioContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// TEST
// ─────────────────────────────────────────────────────────────────

const tipoPreguntaTestSchema = z.enum(["seleccion_unica", "seleccion_multiple", "verdadero_falso"])
export type TipoPreguntaTest = z.infer<typeof tipoPreguntaTestSchema>

export const opcionTestSchema = z.object({
  texto: z.string(),
  esCorrecta: z.boolean(),
})
export type OpcionTest = z.infer<typeof opcionTestSchema>

export const preguntaTestSchema = z.object({
  enunciado: z.string(),
  tipo: tipoPreguntaTestSchema,
  opciones: z.array(opcionTestSchema),
  explicacion: z.string().optional(),
})
export type PreguntaTest = z.infer<typeof preguntaTestSchema>

export const testContenidoSchema = z.object({
  tipo: z.literal("TEST"),
  contenido: z.object({
    preguntas: z.array(preguntaTestSchema).default([]),
    aleatorizar: z.boolean().default(false),
    mostrarResultadoInmediato: z.boolean().default(true),
    intentosPermitidos: z.number().int().min(1).default(3),
  }),
  metadata: metadataBaseSchema.optional(),
})
export type TestContenido = z.infer<typeof testContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// Discriminated union — payload completo (tipo + contenido + metadata)
// ─────────────────────────────────────────────────────────────────

export const contenidoPayloadSchema = z.discriminatedUnion("tipo", [
  lecturaContenidoSchema,
  videoContenidoSchema,
  recursoContenidoSchema,
  ejemploCodigoContenidoSchema,
  ejercicioContenidoSchema,
  testContenidoSchema,
])
export type ContenidoPayload = z.infer<typeof contenidoPayloadSchema>

// ─────────────────────────────────────────────────────────────────
// Item devuelto por el endpoint de detalle (incluye payload completo)
// ─────────────────────────────────────────────────────────────────

// El item devuelto incluye el payload `contenido` completo (a diferencia del
// embebido en SeccionAdminItem, que solo trae cabecera). `contenido` se
// devuelve permisivo (z.unknown) porque la forma exacta depende del tipo —
// el front la valida con el schema discriminado al recibir.
export const contenidoAdminItemSchema = z.object({
  id: z.string(),
  seccionId: z.string(),
  tipo: tipoContenidoSchema,
  titulo: z.string(),
  orden: z.number().int().min(1),
  contenido: z.unknown(),
  metadata: z.record(z.unknown()).nullable(),
  archivado: z.boolean(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
})
export type ContenidoAdminItem = z.infer<typeof contenidoAdminItemSchema>

export const obtenerContenidosAdminResponseSchema = z.object({
  items: z.array(contenidoAdminItemSchema),
})
export type ObtenerContenidosAdminResponse = z.infer<typeof obtenerContenidosAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Crear / Actualizar / Reordenar
// ─────────────────────────────────────────────────────────────────

// En POST, `contenido` y `metadata` son opcionales: si no llegan, el back
// aplica defaults por tipo. Si llegan, el service valida con el schema del
// tipo correspondiente.
export const crearContenidoInputSchema = z.object({
  tipo: tipoContenidoSchema,
  titulo: z
    .string()
    .min(1, "El titulo es obligatorio")
    .max(200, "El titulo no puede exceder 200 caracteres"),
  contenido: z.unknown().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})
export type CrearContenidoInput = z.infer<typeof crearContenidoInputSchema>

// PATCH parcial. NO permite cambiar `tipo` ni `seccionId`. Si llega
// `contenido`, el service lo valida contra el schema del tipo actual del
// contenido en BD.
export const actualizarContenidoInputSchema = z
  .object({
    titulo: z.string().min(1).max(200),
    contenido: z.unknown(),
    metadata: z.record(z.unknown()).nullable(),
  })
  .partial()
export type ActualizarContenidoInput = z.infer<typeof actualizarContenidoInputSchema>

// Batch de reorden: cada item lleva su id y el orden destino. El service
// valida que todos los ids pertenezcan a la seccion antes de tocar nada.
export const reordenarContenidosInputSchema = z.object({
  ordenes: z
    .array(
      z.object({
        id: z.string().min(1),
        orden: z.number().int().min(0),
      }),
    )
    .min(1, "Lista de ordenes vacia"),
})
export type ReordenarContenidosInput = z.infer<typeof reordenarContenidosInputSchema>
