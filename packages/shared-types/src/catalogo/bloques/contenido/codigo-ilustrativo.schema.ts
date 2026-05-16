import { z } from "zod"

/**
 * Contenido de un bloque CODIGO_ILUSTRATIVO (snippet de codigo no evaluable).
 *
 * Shape canonico que escribe `editor-codigo-ilustrativo.tsx`. Sirve para
 * mostrar un trozo de codigo de apoyo; el participante lo lee y avanza,
 * sin evaluacion.
 *
 * - `lenguaje`: clave del resaltado (typescript, python, etc.). Se deja
 *   como string libre por ahora; sera enum cuando consolidemos la lista
 *   en `SelectLenguaje` del frontend. Min 1 char (no admite cadena vacia
 *   porque siempre hay que resaltar algo).
 * - `codigo`: el snippet en si, sin transformacion. Vacio valido al crear.
 * - `descripcion`: linea opcional debajo del bloque. Vacio valido.
 */
export const contenidoCodigoIlustrativoSchema = z
  .object({
    lenguaje: z.string().min(1).max(30),
    codigo: z.string().max(20_000),
    descripcion: z.string().max(2_000),
  })
  .strict()

export type ContenidoCodigoIlustrativo = z.infer<typeof contenidoCodigoIlustrativoSchema>
