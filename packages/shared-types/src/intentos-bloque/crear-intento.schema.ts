import { z } from "zod"

/**
 * Body de `POST /api/v1/intentos-bloque` (D-S7-C2, D-S7-D1).
 *
 * `.strict()` rechaza propiedades extra — explicitamente bloquea
 * `colaboradorId`: la identidad del usuario SIEMPRE viene de la sesion del
 * request via `@CurrentUser()`, jamas del body (OWASP A01). El admin-en-nombre
 * (D-S7-D1) queda diferido post-MVP.
 */
export const crearIntentoBloqueSchema = z
  .object({
    bloqueId: z.string().uuid(),
    cursoId: z.string().uuid(),
    respuestas: z
      .object({
        preguntas: z
          .array(
            z
              .object({
                preguntaId: z.string().min(1),
                opcionElegidaId: z.string().min(1),
              })
              .strict(),
          )
          .min(1)
          .max(200),
      })
      .strict(),
  })
  .strict()

export type CrearIntentoBloqueInput = z.infer<typeof crearIntentoBloqueSchema>
