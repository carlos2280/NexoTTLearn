import { z } from "zod"
import { respuestaPreguntaSchema } from "./crear-intento.schema"

/**
 * Contrato de las respuestas tal como el backend las PERSISTE (no lo que el
 * cliente envia). Difiere de `respuestasIntentoSchema` porque el service las
 * enriquece antes de guardar:
 *  - QUIZ: identico al enviado (las opciones elegidas).
 *  - CODIGO_PREGUNTAS: agrega `lenguaje`, `puntos*` y los `resultadosTests`
 *    llevan `descripcion`/`visible`/`stdoutEsperado` autoritativos del bloque.
 *  - SQL_EJERCICIO: (pendiente P21-SQL) analogo con `consultaEnviada`.
 *
 * Se usa SOLO para leer el `mejor-intento` en la vista de revision del alumno
 * (P13 quiz / P21 codigo). Por eso vive aparte del contrato de creacion.
 */

/**
 * Resultado por test PERSISTIDO (enriquecido). Misma forma que el
 * `ResultadoTestUI` del front, asi la vista de revision lo pinta sin remapear.
 */
export const resultadoTestGuardadoSchema = z
  .object({
    testId: z.string(),
    descripcion: z.string(),
    visible: z.boolean(),
    paso: z.boolean(),
    estado: z.enum(["ok", "timeout", "fallo"]),
    stdoutObtenido: z.string(),
    stdoutEsperado: z.string(),
    stderr: z.string(),
    duracionMs: z.number(),
  })
  .strict()
export type ResultadoTestGuardado = z.infer<typeof resultadoTestGuardadoSchema>

const respuestasQuizGuardadasSchema = z
  .object({
    tipo: z.literal("QUIZ"),
    preguntas: z.array(respuestaPreguntaSchema),
  })
  .strict()

const respuestasCodigoGuardadasSchema = z
  .object({
    tipo: z.literal("CODIGO_PREGUNTAS"),
    lenguaje: z.string(),
    codigoEnviado: z.string(),
    resultadosTests: z.array(resultadoTestGuardadoSchema),
    puntosObtenidos: z.number(),
    puntosTotales: z.number(),
  })
  .strict()

export const respuestasGuardadasSchema = z.discriminatedUnion("tipo", [
  respuestasQuizGuardadasSchema,
  respuestasCodigoGuardadasSchema,
])
export type RespuestasGuardadas = z.infer<typeof respuestasGuardadasSchema>
