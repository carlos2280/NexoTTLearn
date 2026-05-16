import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/umbrales-logro — override por curso de la tabla
 * de logros (cap. 10.5). Reglas:
 *   - cada umbral en [0,100].
 *   - monotonia decreciente: excelencia >= solido >= enDesarrollo.
 *   - `null` resetea a los defaults del sistema.
 *
 * Se persiste en `Curso.umbralesLogro` (JsonB).
 */
const umbralesLogroValoresSchema = z
  .object({
    excelencia: z.number().min(0).max(100),
    solido: z.number().min(0).max(100),
    enDesarrollo: z.number().min(0).max(100),
  })
  .strict()

export const actualizarUmbralesLogroCursoSchema = z
  .object({
    umbralesLogro: umbralesLogroValoresSchema.nullable(),
  })
  .strict()

export type UmbralesLogroValores = z.infer<typeof umbralesLogroValoresSchema>
export type ActualizarUmbralesLogroCursoInput = z.infer<typeof actualizarUmbralesLogroCursoSchema>
