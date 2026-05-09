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

// Forma minima de un documento Tiptap serializado a JSON. Schema laxo a
// proposito: cada nodo es un record con `type` requerido y el resto pasa
// passthrough para no atarse a la lista exacta de extensiones (cambia entre
// fases). La validacion estricta de nodos vive en el editor admin (Fase 2).
const tiptapNodeSchema = z
  .object({
    type: z.string(),
  })
  .passthrough()

export const tiptapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(tiptapNodeSchema).default([]),
  })
  .passthrough()
export type TiptapJSONDoc = z.infer<typeof tiptapDocSchema>

export const lecturaContenidoSchema = z.object({
  tipo: z.literal("LECTURA"),
  contenido: z.object({
    doc: tiptapDocSchema,
  }),
  metadata: metadataBaseSchema
    .extend({
      nivel: nivelDificultadBasicoSchema.optional(),
    })
    .optional(),
})
export type LecturaContenido = z.infer<typeof lecturaContenidoSchema>
