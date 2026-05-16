import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/skills-exigidas — actualiza la lista completa
 * de skills exigidas y su nota minima. D82 (cobertura skill ↔ modulo) se
 * evalua como aviso (no bloquea aqui); bloquea solo en /modulos-habilitados
 * sobre curso ACTIVO y en /publicar.
 */
export const actualizarSkillsExigidasCursoSchema = z
  .object({
    skills: z
      .array(
        z
          .object({
            skillId: z.string().uuid(),
            notaMinima: z.number().min(0).max(100),
          })
          .strict(),
      )
      .max(200),
  })
  .strict()
  .refine(
    (v) => {
      const ids = v.skills.map((s) => s.skillId)
      return new Set(ids).size === ids.length
    },
    { message: "skillId duplicado en la lista.", path: ["skills"] },
  )

export type ActualizarSkillsExigidasCursoInput = z.infer<typeof actualizarSkillsExigidasCursoSchema>
