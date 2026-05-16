import { z } from "zod"

/**
 * Variantes visuales del bloque TIP. Cada una mapea a una capa de feedback
 * semantico (info / warning / success) — ver IDENTIDAD-VISUAL §3 capas.
 */
export const varianteTipSchema = z.enum(["info", "warning", "exito"])
export type VarianteTip = z.infer<typeof varianteTipSchema>

/**
 * Contenido de un bloque TIP (callout corto con borde semantico).
 *
 * Shape canonico que escribe `editor-tip.tsx`. El cuerpo es HTML rico
 * pero con extensiones minimas de Tiptap (negrita, italica, listas);
 * sin titulos ni tablas para mantener el callout compacto.
 *
 * - `variante`: tono semantico que define color del borde + bg-soft.
 * - `html`: HTML serializado del cuerpo del callout. Vacio valido al
 *   crear; cap 10 KB porque un TIP largo deja de ser TIP.
 */
export const contenidoTipSchema = z
  .object({
    variante: varianteTipSchema,
    html: z.string().max(10_000),
  })
  .strict()

export type ContenidoTip = z.infer<typeof contenidoTipSchema>
