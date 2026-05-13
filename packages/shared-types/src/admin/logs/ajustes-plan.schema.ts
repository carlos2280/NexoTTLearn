import { z } from "zod"
import { ACCIONES_AJUSTE_PLAN } from "./ajustes-plan.types"

const accionValues = ACCIONES_AJUSTE_PLAN as unknown as readonly [string, ...string[]]

/**
 * Schema para `GET /admin/logs/ajustes-plan`.
 *
 * Filtros opcionales en AND. `accion` acotada al enum Prisma. Cap duro
 * `pageSize <= 200`.
 */
export const listarLogsAjustesPlanQuerySchema = z.object({
  planId: z.string().uuid().optional(),
  accion: z.enum(accionValues).optional(),
  seccionId: z.string().uuid().optional(),
  autorUsuarioId: z.string().uuid().optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarLogsAjustesPlanQuery = z.infer<typeof listarLogsAjustesPlanQuerySchema>
