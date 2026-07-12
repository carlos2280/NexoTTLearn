import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/umbrales-logro — override por curso de la tabla
 * de logros (cap. 10.5). Reglas:
 *   - cada umbral en [0,100] (lo valida ESTE schema).
 *   - monotonia decreciente: excelencia >= solido >= enDesarrollo (la valida el
 *     service en `cursos.service.ts`, NO este schema — code
 *     `VALIDACION_UMBRALES_LOGRO_MONOTONIA`). `parseUmbralesLogro`, que reusa
 *     este schema para leer el JSONB, no exige monotonia.
 *   - `null` resetea a los defaults del sistema.
 *
 * Se persiste en `Curso.umbralesLogro` (JsonB).
 */
export const umbralesLogroValoresSchema = z
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
