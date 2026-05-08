// Payloads canonicos del runtime de bloques (capa 1 — participante).
// Vive aqui (no en admin-contenidos) porque admin-contenidos es legacy y se
// elimina junto con apps/api/src/admin/_legacy en el PR de limpieza final.
// Este archivo NO se borra: lo consume el runtime participante.

import { z } from "zod"

const nivelDificultadBasicoSchema = z.enum(["basico", "intermedio", "avanzado"])
export type NivelDificultadBasico = z.infer<typeof nivelDificultadBasicoSchema>

const metadataBaseSchema = z
  .object({
    duracionEstimada: z.number().int().min(0).optional(),
  })
  .passthrough()

// Payload de un bloque PARRAFO (lectura). El `cuerpo` viene como HTML
// pre-serializado de Tiptap (lo que guarda el admin). Si en el futuro se
// migra a JSON Tiptap, este schema cambia y los renderers se ajustan.
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
