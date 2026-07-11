import { z } from "zod"

/**
 * Respuesta del endpoint `POST /imagenes` (subida de imágenes de contenido
 * desde los editores TipTap). `url` es absoluta y apunta al endpoint que sirve
 * la imagen (`GET /imagenes/:archivoId`), para insertarla directamente en el
 * HTML del bloque y que el visor inmersivo la cargue.
 */
export const subirImagenResponseSchema = z
  .object({
    archivoId: z.string().uuid(),
    url: z.string().url(),
  })
  .strict()

export type SubirImagenResponse = z.infer<typeof subirImagenResponseSchema>

/** MIME types de imagen aceptados por el endpoint de subida (sin SVG por XSS). */
export const MIME_IMAGEN_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const

/** Tamaño máximo de una imagen de contenido (5 MB). */
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024
