import { z } from "zod"

/**
 * Body de `POST /api/v1/cursos/:cursoId/transversal/skills` (D85 + D-S8-C6).
 *
 * Lista cerrada de skills etiquetadas al transversal. El servicio aplica
 * replace total (no merge): cada peticion sobrescribe los `transversales_skills`.
 * Si el curso ya estaba ACTIVO, exige tambien `X-Motivo` (verificado por
 * `MotivoGuard` global aguas arriba).
 */
export const editarSkillsTransversalSchema = z
  .object({
    skillIds: z.array(z.string().uuid()).min(1).max(20),
  })
  .strict()

export type EditarSkillsTransversalInput = z.infer<typeof editarSkillsTransversalSchema>

export const editarSkillsTransversalResponseSchema = z
  .object({
    transversalId: z.string().uuid(),
    skillsActualizadas: z.array(z.string().uuid()),
    intentosRecalculados: z.number().int().min(0),
  })
  .strict()

export type EditarSkillsTransversalResponse = z.infer<typeof editarSkillsTransversalResponseSchema>
