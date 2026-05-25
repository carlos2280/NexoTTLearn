import { z } from "zod"

/**
 * Subtipos del bloque RECURSO:
 *  - `enlace`: link externo (docs, GitHub, articulo).
 *  - `adjunto`: archivo subido a la plataforma (PDF, ZIP, etc.).
 */
export const subtipoRecursoSchema = z.enum(["enlace", "adjunto"])
export type SubtipoRecurso = z.infer<typeof subtipoRecursoSchema>

/**
 * Contenido de un bloque RECURSO (material de apoyo, no evaluable).
 *
 * Shape canonico que escribe `editor-recurso.tsx`. Se marca completado al
 * abrir el recurso por primera vez.
 *
 * - `subtipo`: enlace externo vs adjunto interno.
 * - `url`: URL del enlace o ruta del adjunto. Vacio valido al crear.
 * - `titulo`: nombre visible al participante. Vacio valido al crear.
 * - `descripcion`: contexto opcional. Vacio valido.
 * - `abrirNuevaPestana`: hint de UX para `target="_blank"`. Solo aplica a
 *   subtipo enlace; en adjunto el frontend lo ignora.
 */
export const contenidoRecursoSchema = z
  .object({
    subtipo: subtipoRecursoSchema,
    url: z.string().max(500),
    titulo: z.string().max(200),
    descripcion: z.string().max(2_000),
    abrirNuevaPestana: z.boolean(),
  })
  .strict()

export type ContenidoRecurso = z.infer<typeof contenidoRecursoSchema>
