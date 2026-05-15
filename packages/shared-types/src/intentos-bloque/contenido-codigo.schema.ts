import { z } from "zod"

/**
 * Shape esperado de `Bloque.contenido` (JSONB) cuando `tipo=CODIGO_PREGUNTAS` y
 * `tipo=CODIGO_TESTS`.
 *
 * Modelo (definido por el editor del admin):
 *  - `CODIGO_PREGUNTAS` es el reto en sí (enunciado + esqueleto + lenguaje).
 *    Siempre se evalúa automáticamente: exige un bloque hermano
 *    `CODIGO_TESTS` que apunte a él vía `codigoPreguntasId`. No existe un
 *    "modo simple / revisión manual"; los retos que no se prestan a tests
 *    stdin/stdout deben modelarse como QUIZ.
 *  - `CODIGO_TESTS` aporta los pares stdin→stdout que se ejecutan contra el
 *    código del participante. El propio bloque NO es evaluable (no acumula
 *    nota): es contenido auxiliar del admin.
 *
 * Los tests son de estilo "competitive programming" (stdin → stdout): se
 * envía `entrada` por stdin al programa del participante y se compara su
 * stdout contra `salidaEsperada` con comparación de texto normalizada (trim
 * + colapso de espacios en blanco final).
 */

/**
 * Lenguajes ejecutables por el sandbox (MVP). Otros lenguajes (java, go,
 * cpp...) están soportados visualmente por el editor pero no se pueden
 * autocorregir todavía. Cuando se añadan, basta con extender este enum.
 */
export const lenguajeEjecutableSchema = z.enum(["javascript", "typescript", "python"])
export type LenguajeEjecutable = z.infer<typeof lenguajeEjecutableSchema>

export const contenidoCodigoPreguntasSchema = z
  .object({
    lenguaje: z.string().min(1),
    enunciado: z.string().min(1).max(20_000),
    esqueletoInicial: z.string().max(50_000).default(""),
    tiempoLimiteSeg: z.number().int().min(1).max(120).default(30),
  })
  .strict()
export type ContenidoCodigoPreguntas = z.infer<typeof contenidoCodigoPreguntasSchema>

export const testStdinStdoutSchema = z
  .object({
    id: z.string().min(1),
    descripcion: z.string().max(500).default(""),
    entrada: z.string().max(10_000).default(""),
    salidaEsperada: z.string().max(10_000),
    visible: z.boolean().default(true),
  })
  .strict()
export type TestStdinStdout = z.infer<typeof testStdinStdoutSchema>

export const contenidoCodigoTestsSchema = z
  .object({
    codigoPreguntasId: z.string().uuid(),
    solucionReferencia: z.string().max(50_000).default(""),
    tests: z.array(testStdinStdoutSchema).min(1).max(40),
  })
  .strict()
export type ContenidoCodigoTests = z.infer<typeof contenidoCodigoTestsSchema>
