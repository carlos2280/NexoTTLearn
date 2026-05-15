import { z } from "zod"

/**
 * Shape esperado de `Bloque.contenido` (JSONB) cuando `tipo=QUIZ`.
 *
 * El editor del admin (apps/web/.../modulo-builder/editores/editor-quiz.tsx)
 * inserta el JSON con este shape; el motor de auto-correccion lo parsea con
 * este schema antes de calcular la nota. Si falla, el endpoint
 * `POST /api/v1/intentos-bloque` devuelve 500 `contenidoBloqueInvalido` —
 * la responsabilidad es del editor que insertó la fila (R-S7-2/R-S7-8).
 *
 * Soporta cuatro tipos de pregunta vía discriminated union por `tipo`:
 *  - OPCION_UNICA: una sola opción marcada con `esCorrecta=true`.
 *  - OPCION_MULTIPLE: ≥1 opción correcta; admite `puntuacionParcial`.
 *  - VERDADERO_FALSO: campo `correcta: boolean`.
 *  - RESPUESTA_CORTA: lista de `respuestasAceptadas` + reglas de normalización.
 */

const solucionVisibleSchema = z.enum(["tras_intento", "al_aprobar", "al_cerrar"])
export type SolucionVisible = z.infer<typeof solucionVisibleSchema>

const normalizacionRespuestaCortaSchema = z
  .object({
    trim: z.boolean(),
    ignorarMayusculas: z.boolean(),
    ignorarAcentos: z.boolean(),
    ignorarEspaciosDobles: z.boolean(),
  })
  .strict()
export type NormalizacionRespuestaCorta = z.infer<typeof normalizacionRespuestaCortaSchema>

const opcionQuizSchema = z
  .object({
    id: z.string().min(1),
    texto: z.string().min(1),
    esCorrecta: z.boolean(),
  })
  .strict()
export type OpcionQuiz = z.infer<typeof opcionQuizSchema>

const preguntaBaseShape = {
  id: z.string().min(1),
  enunciado: z.string().min(1),
  pesoPunto: z.number().min(0).default(1),
  explicacion: z.string().optional(),
} as const

// Las invariantes de "exactamente una correcta" (OPCION_UNICA) y "al menos una
// correcta" (OPCION_MULTIPLE) se validan en `superRefine` sobre el contenido
// completo más abajo, porque `discriminatedUnion` de Zod 3 no admite miembros
// envueltos en `.refine()` (espera ZodObject puros).
const preguntaOpcionUnicaSchema = z
  .object({
    ...preguntaBaseShape,
    tipo: z.literal("OPCION_UNICA"),
    opciones: z.array(opcionQuizSchema).min(2).max(6),
  })
  .strict()

const preguntaOpcionMultipleSchema = z
  .object({
    ...preguntaBaseShape,
    tipo: z.literal("OPCION_MULTIPLE"),
    opciones: z.array(opcionQuizSchema).min(2).max(6),
    puntuacionParcial: z.boolean().default(false),
  })
  .strict()

const preguntaVerdaderoFalsoSchema = z
  .object({
    ...preguntaBaseShape,
    tipo: z.literal("VERDADERO_FALSO"),
    correcta: z.boolean(),
  })
  .strict()

const preguntaRespuestaCortaSchema = z
  .object({
    ...preguntaBaseShape,
    tipo: z.literal("RESPUESTA_CORTA"),
    respuestasAceptadas: z.array(z.string().min(1)).min(1).max(10),
    normalizacion: normalizacionRespuestaCortaSchema.default({
      trim: true,
      ignorarMayusculas: true,
      ignorarAcentos: true,
      ignorarEspaciosDobles: true,
    }),
  })
  .strict()

export const preguntaQuizSchema = z.discriminatedUnion("tipo", [
  preguntaOpcionUnicaSchema,
  preguntaOpcionMultipleSchema,
  preguntaVerdaderoFalsoSchema,
  preguntaRespuestaCortaSchema,
])
export type PreguntaQuiz = z.infer<typeof preguntaQuizSchema>
export type PreguntaOpcionUnica = z.infer<typeof preguntaOpcionUnicaSchema>
export type PreguntaOpcionMultiple = z.infer<typeof preguntaOpcionMultipleSchema>
export type PreguntaVerdaderoFalso = z.infer<typeof preguntaVerdaderoFalsoSchema>
export type PreguntaRespuestaCorta = z.infer<typeof preguntaRespuestaCortaSchema>

export const tipoPreguntaQuizSchema = z.enum([
  "OPCION_UNICA",
  "OPCION_MULTIPLE",
  "VERDADERO_FALSO",
  "RESPUESTA_CORTA",
])
export type TipoPreguntaQuiz = z.infer<typeof tipoPreguntaQuizSchema>

export const contenidoQuizSchema = z
  .object({
    intentosMax: z.number().int().min(1).max(100).nullable().default(null),
    solucionVisible: solucionVisibleSchema.default("al_aprobar"),
    ordenAleatorio: z.boolean().default(false),
    notaMinima: z.number().min(0).max(100).default(60),
    preguntas: z.array(preguntaQuizSchema).min(1).max(50),
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const [idx, pregunta] of data.preguntas.entries()) {
      if (pregunta.tipo === "OPCION_UNICA") {
        const correctas = pregunta.opciones.filter((o) => o.esCorrecta).length
        if (correctas !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["preguntas", idx, "opciones"],
            message: "OPCION_UNICA requiere exactamente una opción con esCorrecta=true.",
          })
        }
      } else if (pregunta.tipo === "OPCION_MULTIPLE") {
        if (!pregunta.opciones.some((o) => o.esCorrecta)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["preguntas", idx, "opciones"],
            message: "OPCION_MULTIPLE requiere al menos una opción con esCorrecta=true.",
          })
        }
      }
    }
  })

export type ContenidoQuiz = z.infer<typeof contenidoQuizSchema>
