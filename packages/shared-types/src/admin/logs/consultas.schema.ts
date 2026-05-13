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
