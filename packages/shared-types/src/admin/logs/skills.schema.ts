import { z } from "zod"
import { TIPOS_EVENTO_LOG_SKILL } from "./skills.types"

const tipoEventoValues = TIPOS_EVENTO_LOG_SKILL as unknown as readonly [string, ...string[]]

/**
 * Schema para `GET /admin/logs/skills`.
 *
 * Visor unificado de las dos tablas de historico de skills. Filtros opcionales
 * en AND. Cap duro `pageSize <= 200`. Si `tipoEvento` se especifica, el backend
 * consulta solo la tabla correspondiente; en caso contrario consulta ambas.
 */
export const listarLogsSkillsQuerySchema = z.object({
  skillId: z.string().uuid().optional(),
  tipoEvento: z.enum(tipoEventoValues).optional(),
  autorUsuarioId: z.string().uuid().optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarLogsSkillsQuery = z.infer<typeof listarLogsSkillsQuerySchema>
