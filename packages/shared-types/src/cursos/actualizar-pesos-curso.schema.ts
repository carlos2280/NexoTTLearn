import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/pesos — pesos intra-skill (bloques/transversal/
 * entrevista) y umbralNoCumple. Reglas (D33, D-CUR-5):
 *   pesoBloques + pesoTransversal + pesoEntrevista = 100.
 * La validacion de suma se hace en el service con `toFixed(2) === "100.00"`
 * cuando los tres llegan; si solo viene un subconjunto, se completa con los
 * valores actuales del curso antes de validar.
 */
export const actualizarPesosCursoSchema = z
  .object({
    pesoBloques: z.number().min(0).max(100).optional(),
    pesoTransversal: z.number().min(0).max(100).optional(),
    pesoEntrevista: z.number().min(0).max(100).optional(),
    umbralNoCumple: z.number().min(0).max(100).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.pesoBloques !== undefined ||
      v.pesoTransversal !== undefined ||
      v.pesoEntrevista !== undefined ||
      v.umbralNoCumple !== undefined,
    { message: "Debe incluir al menos un campo a actualizar." },
  )

export type ActualizarPesosCursoInput = z.infer<typeof actualizarPesosCursoSchema>
