import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/modulos-habilitados — set deseado de modulos
 * habilitados. Reglas (D79): no se permiten modulos ARCHIVADO. Reglas (D82):
 * en curso ACTIVO, deshabilitar un modulo que es el unico que cubre una
 * skill exigida → 422. Diff aEliminar/aAgregar (D-CUR-6).
 */
export const actualizarModulosHabilitadosCursoSchema = z
  .object({
    moduloIds: z
      .array(z.string().uuid())
      .max(200)
      .refine((ids) => new Set(ids).size === ids.length, "moduloId duplicado en la lista."),
  })
  .strict()

export type ActualizarModulosHabilitadosCursoInput = z.infer<
  typeof actualizarModulosHabilitadosCursoSchema
>

/**
 * Skill que quedaria sin cobertura tras un cambio de modulos o de skills
 * exigidas. Se emite como aviso en `/skills-exigidas` y como bloqueante en
 * `/modulos-habilitados` con curso ACTIVO.
 */
export interface SkillSinCobertura {
  readonly skillId: string
  readonly etiquetaVisible: string
}
