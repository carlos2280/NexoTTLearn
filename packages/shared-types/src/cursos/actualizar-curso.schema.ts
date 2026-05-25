import { z } from "zod"
import { desbloqueoCursoSchema } from "./curso.types"

const fechaDiaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Debe ser fecha en formato YYYY-MM-DD")

/**
 * PATCH /api/v1/cursos/:id — edicion de campos generales. En P4a solo el
 * estado BORRADOR admite mutacion (el service rechaza con 409 en otros
 * estados). `previewSolo=true` simula sin escribir.
 *
 * No incluye los sub-recursos (areas/skills/modulos/pesos intra-skill avanzados);
 * esos viven en endpoints especificos del P4b.
 */
export const actualizarCursoSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200).optional(),
    clienteId: z.string().uuid().optional(),
    fechaInicio: fechaDiaSchema.optional(),
    fechaDeadline: fechaDiaSchema.optional(),
    toggleVoluntarios: z.boolean().optional(),
    toggleCierreAutomatico: z.boolean().optional(),
    umbralNoCumple: z.number().min(0).max(100).optional(),
    pesoBloques: z.number().min(0).max(100).optional(),
    pesoTransversal: z.number().min(0).max(100).optional(),
    pesoEntrevista: z.number().min(0).max(100).optional(),
    desbloqueo: desbloqueoCursoSchema.optional(),
    fechaDesbloqueo: fechaDiaSchema.nullable().optional(),
    previewSolo: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.titulo !== undefined ||
      v.clienteId !== undefined ||
      v.fechaInicio !== undefined ||
      v.fechaDeadline !== undefined ||
      v.toggleVoluntarios !== undefined ||
      v.toggleCierreAutomatico !== undefined ||
      v.umbralNoCumple !== undefined ||
      v.pesoBloques !== undefined ||
      v.pesoTransversal !== undefined ||
      v.pesoEntrevista !== undefined ||
      v.desbloqueo !== undefined ||
      v.fechaDesbloqueo !== undefined,
    { message: "Debe incluir al menos un campo a actualizar." },
  )

export type ActualizarCursoInput = z.infer<typeof actualizarCursoSchema>
