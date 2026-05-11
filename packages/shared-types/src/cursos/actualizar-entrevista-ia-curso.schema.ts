import { z } from "zod"

/**
 * Replicas de los enums Prisma `FilosofiaEntrevista`, `ProfundidadEntrevista`
 * y `TonoEntrevista`. Mantener sincronizado con `schema.prisma`.
 */
export const filosofiaEntrevistaSchema = z.enum(["PREPARACION", "FILTRO"])
export type FilosofiaEntrevista = z.infer<typeof filosofiaEntrevistaSchema>

export const profundidadEntrevistaSchema = z.enum(["JUNIOR", "SEMI_SENIOR", "SENIOR"])
export type ProfundidadEntrevista = z.infer<typeof profundidadEntrevistaSchema>

export const tonoEntrevistaSchema = z.enum(["CONVERSACIONAL", "FORMAL"])
export type TonoEntrevista = z.infer<typeof tonoEntrevistaSchema>

/**
 * PATCH /api/v1/cursos/:id/entrevista-ia — D-CUR-8 (sub-recurso lazy).
 * Reglas: suma de `rubrica.peso` = 100; `duracionMinutos` ∈ {15,30,45};
 * `umbralAprobacion` en [0,100]. 409 si desactiva y hay intentos.
 */
export const actualizarEntrevistaIaCursoSchema = z
  .object({
    activo: z.boolean(),
    umbralAprobacion: z.number().min(0).max(100).optional(),
    filosofia: filosofiaEntrevistaSchema.optional(),
    profundidad: profundidadEntrevistaSchema.optional(),
    duracionMinutos: z.number().int().optional(),
    tono: tonoEntrevistaSchema.optional(),
    rubrica: z
      .array(
        z
          .object({
            areaId: z.string().uuid(),
            peso: z.number().min(0).max(100),
          })
          .strict(),
      )
      .max(50)
      .optional()
      .refine((arr) => {
        if (!arr) {
          return true
        }
        const ids = arr.map((r) => r.areaId)
        return new Set(ids).size === ids.length
      }, "areaId duplicado en la rubrica."),
  })
  .strict()

export type ActualizarEntrevistaIaCursoInput = z.infer<typeof actualizarEntrevistaIaCursoSchema>
