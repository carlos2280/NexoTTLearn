import { z } from "zod"

/**
 * Schema para `GET /admin/logs/asignaciones`.
 *
 * Filtros opcionales en AND. `estadoNuevo` se acepta como string libre (max 60
 * chars) porque la columna en BD no esta acotada a un enum cerrado.
 */
export const listarLogsAsignacionesQuerySchema = z.object({
  asignacionId: z.string().uuid().optional(),
  estadoNuevo: z.string().min(1).max(60).optional(),
  autorUsuarioId: z.string().uuid().optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarLogsAsignacionesQuery = z.infer<typeof listarLogsAsignacionesQuerySchema>
