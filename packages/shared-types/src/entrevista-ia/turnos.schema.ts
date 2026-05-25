import { z } from "zod"

/**
 * Body del endpoint `POST /api/v1/intentos-entrevista-ia/:intentoId/turnos`
 * (D-S8-D2). El mensaje del colaborador se valida con limites estrictos:
 *  - min(1) para evitar bodies vacios.
 *  - max(4000) chars para acotar consumo de tokens (R-S8-1).
 *  - trim() normaliza espacios.
 *  - saneamiento de chars de control aplicado server-side (R-S8-9).
 */
export const enviarTurnoSchema = z
  .object({
    mensaje: z.string().min(1).max(4000).trim(),
  })
  .strict()

export type EnviarTurnoInput = z.infer<typeof enviarTurnoSchema>

/**
 * Respuesta del POST turno. `finalizado=true` significa que la IA considera la
 * entrevista terminada y el cliente debe disparar `POST .../finalizar`. Cuando
 * `finalizado=true`, `siguientePregunta` puede ser null.
 */
export const enviarTurnoResponseSchema = z
  .object({
    respuestaIa: z.string(),
    finalizado: z.boolean(),
    siguientePregunta: z.string().nullable(),
  })
  .strict()

export type EnviarTurnoResponse = z.infer<typeof enviarTurnoResponseSchema>
