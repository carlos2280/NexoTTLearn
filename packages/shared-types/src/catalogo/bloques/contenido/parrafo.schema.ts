import { z } from "zod"

/**
 * Contenido de un bloque PARRAFO (rich text con Tiptap).
 *
 * Shape canonico que escribe el editor del admin
 * (`apps/web/.../modulo-builder/editores/editor-parrafo.tsx`) y consume el
 * player del participante. Strings vacios son validos en estado inicial:
 * el bloque se crea en blanco y el admin lo llena.
 *
 * - `html`: contenido renderizable producido por Tiptap (HTML serializado).
 * - `textoPlano`: extraccion plana del HTML para busquedas y calculo de
 *   tiempo de lectura. Derivado del html, lo persiste el mismo editor.
 * - `tiempoLecturaMin`: minutos estimados de lectura (200 palabras/min).
 *   Cap superior en 120 min para detectar shapes corruptos.
 */
export const contenidoParrafoSchema = z
  .object({
    html: z.string().max(50_000),
    textoPlano: z.string().max(50_000),
    tiempoLecturaMin: z.number().int().min(0).max(120),
  })
  .strict()

export type ContenidoParrafo = z.infer<typeof contenidoParrafoSchema>
