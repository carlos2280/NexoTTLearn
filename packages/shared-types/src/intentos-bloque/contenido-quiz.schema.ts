import { z } from "zod"

/**
 * Shape esperado de `Bloque.contenido` (JSONB) cuando `tipo=QUIZ` (D-S7-C2).
 *
 * El editor de bloques inserta el JSON con este shape; el motor de
 * auto-correccion lo parsea con este schema antes de calcular la nota. Si
 * falla, el endpoint POST /intentos-bloque devuelve 500 `contenidoBloqueInvalido`
 * — la responsabilidad es del editor que insertó la fila (R-S7-2/R-S7-8).
 */
export const contenidoQuizSchema = z
  .object({
    preguntas: z
      .array(
        z
          .object({
            id: z.string().min(1),
            enunciado: z.string().min(1),
            opciones: z
              .array(
                z
                  .object({
                    id: z.string().min(1),
                    texto: z.string().min(1),
                  })
                  .strict(),
              )
              .min(2),
            respuestaCorrectaId: z.string().min(1),
            pesoPunto: z.number().min(0).default(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()

export type ContenidoQuiz = z.infer<typeof contenidoQuizSchema>
