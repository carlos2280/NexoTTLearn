import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/transversal — D-CUR-8 (sub-recurso lazy):
 *   - `activo: true` con curso sin transversal → create ProyectoTransversal.
 *   - `activo: true` con curso con transversal → update + diff skills.
 *   - `activo: false` sin intentos → delete (limpia `curso.transversalId`).
 *   - `activo: false` con intentos → 409 CONFLICT_TRANSVERSAL_CON_INTENTOS.
 *
 * Reglas (D86): pesoCapaTests + pesoCapaCualitativa + pesoCapaComprension
 * = 100 cuando `activo=true`; `umbralAprobacion` en [0,100].
 */
export const actualizarTransversalCursoSchema = z
  .object({
    activo: z.boolean(),
    descripcion: z.string().trim().min(1).max(2000).optional(),
    umbralAprobacion: z.number().min(0).max(100).optional(),
    pesoCapaTests: z.number().min(0).max(100).optional(),
    pesoCapaCualitativa: z.number().min(0).max(100).optional(),
    pesoCapaComprension: z.number().min(0).max(100).optional(),
    capaTestsActiva: z.boolean().optional(),
    capaCualitativaActiva: z.boolean().optional(),
    capaComprensionActiva: z.boolean().optional(),
    skillsQueMideIds: z
      .array(z.string().uuid())
      .max(200)
      .optional()
      .refine(
        (ids) => ids === undefined || new Set(ids).size === ids.length,
        "skillId duplicado en skillsQueMideIds.",
      ),
  })
  .strict()

export type ActualizarTransversalCursoInput = z.infer<typeof actualizarTransversalCursoSchema>
