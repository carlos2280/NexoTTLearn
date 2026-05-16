import { z } from "zod"

/**
 * Body de `POST /api/v1/intentos-bloque` (D-S7-C2, D-S7-D1).
 *
 * `.strict()` rechaza propiedades extra — explicitamente bloquea
 * `colaboradorId`: la identidad del usuario SIEMPRE viene de la sesion del
 * request via `@CurrentUser()`, jamas del body (OWASP A01). El admin-en-nombre
 * (D-S7-D1) queda diferido post-MVP.
 *
 * `respuestas` es una discriminated union por `tipo` de bloque. El motor
 * valida en runtime que `respuestas.tipo === bloque.tipo`:
 *  - QUIZ → `{ preguntas: RespuestaPregunta[] }` (ver §QUIZ abajo).
 *  - CODIGO_PREGUNTAS → `{ codigoEnviado, resultadosTests }`. La ejecucion del
 *    codigo del participante corre en el navegador (Pyodide para Python,
 *    Web Worker para JS/TS). El cliente reporta el resultado por test y el
 *    backend NO confia en una `nota` enviada por el cliente: la recalcula a
 *    partir de `testsPasados` despues de validar que los `testId` recibidos
 *    coinciden con los del bloque `CODIGO_TESTS` hermano. El codigo fuente
 *    queda persistido en `respuestas` para auditoria por admin.
 */

// --- QUIZ ---------------------------------------------------------------

const respuestaOpcionUnicaSchema = z
  .object({
    preguntaId: z.string().min(1),
    tipo: z.literal("OPCION_UNICA"),
    opcionElegidaId: z.string().min(1),
  })
  .strict()

const respuestaOpcionMultipleSchema = z
  .object({
    preguntaId: z.string().min(1),
    tipo: z.literal("OPCION_MULTIPLE"),
    opcionesElegidasIds: z.array(z.string().min(1)).max(10),
  })
  .strict()

const respuestaVerdaderoFalsoSchema = z
  .object({
    preguntaId: z.string().min(1),
    tipo: z.literal("VERDADERO_FALSO"),
    valor: z.boolean(),
  })
  .strict()

const respuestaCortaSchema = z
  .object({
    preguntaId: z.string().min(1),
    tipo: z.literal("RESPUESTA_CORTA"),
    texto: z.string().max(500),
  })
  .strict()

export const respuestaPreguntaSchema = z.discriminatedUnion("tipo", [
  respuestaOpcionUnicaSchema,
  respuestaOpcionMultipleSchema,
  respuestaVerdaderoFalsoSchema,
  respuestaCortaSchema,
])
export type RespuestaPregunta = z.infer<typeof respuestaPreguntaSchema>

const respuestasQuizSchema = z
  .object({
    tipo: z.literal("QUIZ"),
    preguntas: z.array(respuestaPreguntaSchema).min(1).max(200),
  })
  .strict()

// --- CODIGO_PREGUNTAS ---------------------------------------------------

/**
 * Resultado por test que reporta el cliente tras ejecutar el codigo del
 * participante en el navegador. El backend valida estructura y recalcula la
 * nota; nunca confia en una nota agregada enviada por el cliente.
 */
export const resultadoTestReportadoSchema = z
  .object({
    testId: z.string().min(1),
    paso: z.boolean(),
    estado: z.enum(["ok", "timeout", "fallo"]),
    stdoutObtenido: z.string().max(20_000).default(""),
    stderr: z.string().max(20_000).default(""),
    duracionMs: z.number().int().min(0).max(120_000),
  })
  .strict()
export type ResultadoTestReportado = z.infer<typeof resultadoTestReportadoSchema>

const respuestasCodigoPreguntasSchema = z
  .object({
    tipo: z.literal("CODIGO_PREGUNTAS"),
    codigoEnviado: z.string().min(1).max(100_000),
    resultadosTests: z.array(resultadoTestReportadoSchema).min(1).max(40),
  })
  .strict()

// --- Union --------------------------------------------------------------

export const respuestasIntentoSchema = z.discriminatedUnion("tipo", [
  respuestasQuizSchema,
  respuestasCodigoPreguntasSchema,
])
export type RespuestasIntento = z.infer<typeof respuestasIntentoSchema>

export const crearIntentoBloqueSchema = z
  .object({
    bloqueId: z.string().uuid(),
    cursoId: z.string().uuid(),
    respuestas: respuestasIntentoSchema,
  })
  .strict()

export type CrearIntentoBloqueInput = z.infer<typeof crearIntentoBloqueSchema>
