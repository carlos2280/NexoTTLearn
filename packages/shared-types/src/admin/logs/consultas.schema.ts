import { z } from "zod"

/**
 * Schema para `GET /admin/logs/consultas` (meta-auditoria).
 *
 * Filtros opcionales en AND. `endpoint` se valida como string (match exacto en
 * el backend). Cap duro `pageSize <= 200`. Este endpoint **no** registra fila
 * propia en `consultas_logs` para evitar recursion infinita.
 */
export const listarLogsConsultasQuerySchema = z.object({
  autorUsuarioId: z.string().uuid().optional(),
  endpoint: z.string().min(1).max(200).optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarLogsConsultasQuery = z.infer<typeof listarLogsConsultasQuerySchema>

/**
 * Schema para `GET /admin/logs/consultas/exportar` (P-B-c). Hereda filtros del
 * visor, omite paginacion, anade `formato`. Este endpoint tampoco registra fila
 * propia en `consultas_logs` (recursion bloqueada — mismo motivo que el listar).
 */
export const exportarLogsConsultasQuerySchema = listarLogsConsultasQuerySchema
  .omit({ page: true, pageSize: true })
  .extend({
    formato: z.enum(["csv", "xlsx"]).default("csv"),
  })

export type ExportarLogsConsultasQuery = z.infer<typeof exportarLogsConsultasQuerySchema>
