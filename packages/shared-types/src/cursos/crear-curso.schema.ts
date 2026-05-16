import { z } from "zod"
import { desbloqueoCursoSchema } from "./curso.types"

/**
 * Fecha en formato `YYYY-MM-DD`. El backend persiste como `@db.Date`.
 */
const fechaDiaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Debe ser fecha en formato YYYY-MM-DD")

/**
 * Schema de creacion de curso (POST /api/v1/cursos). El curso siempre se crea
 * en estado BORRADOR (D-CUR-12). Los pesos intra-skill default vienen del
 * schema Prisma (70/20/10) y pueden sobrescribirse aqui.
 *
 * La validacion cruzada `fechaInicio < fechaDeadline` y la coherencia con
 * `desbloqueo === DESDE_FECHA` viven en el service (D-CUR-7): Zod no puede
 * comparar fechas como strings de forma fiable.
 */
export const crearCursoSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200),
    clienteId: z.string().uuid(),
    fechaInicio: fechaDiaSchema,
    fechaDeadline: fechaDiaSchema,
    toggleVoluntarios: z.boolean().optional(),
    toggleCierreAutomatico: z.boolean().optional(),
    umbralNoCumple: z.number().min(0).max(100).optional(),
    pesoBloques: z.number().min(0).max(100).optional(),
    pesoTransversal: z.number().min(0).max(100).optional(),
    pesoEntrevista: z.number().min(0).max(100).optional(),
    desbloqueo: desbloqueoCursoSchema.optional(),
    fechaDesbloqueo: fechaDiaSchema.nullable().optional(),
  })
  .strict()

export type CrearCursoInput = z.infer<typeof crearCursoSchema>
