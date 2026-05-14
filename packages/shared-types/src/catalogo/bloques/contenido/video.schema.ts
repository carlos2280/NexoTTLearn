import { z } from "zod"

/**
 * Proveedores soportados para el embed de video. `otro` permite URLs
 * directas (mp4 propio, link sin player conocido) — el reproductor cae
 * al `<video>` nativo.
 */
export const proveedorVideoSchema = z.enum(["youtube", "vimeo", "loom", "otro"])
export type ProveedorVideo = z.infer<typeof proveedorVideoSchema>

/**
 * Contenido de un bloque VIDEO.
 *
 * Shape canonico que escribe `editor-video.tsx`. El bloque se marca como
 * completado cuando el participante alcanza `marcarAlPorcentaje` % de
 * reproduccion.
 *
 * - `url`: URL canonica del video. Se acepta cadena vacia al crear (el
 *   admin la pega despues). El formato de URL no se valida aqui — eso es
 *   trabajo del editor (UI) que ya detecta proveedor.
 * - `proveedor`: deducible de la URL pero se persiste explicito para que
 *   el player no tenga que reparsear.
 * - `marcarAlPorcentaje`: 0..100 (entero). Default razonable del editor: 90.
 * - `notas`: notas/contexto opcional para el participante. Vacio valido.
 */
export const contenidoVideoSchema = z
  .object({
    url: z.string().max(500),
    proveedor: proveedorVideoSchema,
    marcarAlPorcentaje: z.number().int().min(0).max(100),
    notas: z.string().max(2_000),
  })
  .strict()

export type ContenidoVideo = z.infer<typeof contenidoVideoSchema>
