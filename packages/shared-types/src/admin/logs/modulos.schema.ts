import { z } from "zod"
import { ESTADOS_LOG_MODULO } from "./modulos.types"

const estadoModuloValues = ESTADOS_LOG_MODULO as unknown as readonly [string, ...string[]]

/**
 * Schema para `GET /admin/logs/modulos`.
 *
 * Filtros opcionales en AND. `estadoNuevo` acotado al enum (`ACTIVO` |
 * `ARCHIVADO`). Cap duro `pageSize <= 200`.
 */
export const listarLogsModulosQuerySchema = z.object({
  moduloId: z.string().uuid().optional(),
  estadoNuevo: z.enum(estadoModuloValues).optional(),
  autorUsuarioId: z.string().uuid().optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarLogsModulosQuery = z.infer<typeof listarLogsModulosQuerySchema>

/**
 * Schema para `GET /admin/logs/modulos/exportar` (P-B-c). Hereda filtros del
 * visor, omite paginacion, anade `formato`.
 */
export const exportarLogsModulosQuerySchema = listarLogsModulosQuerySchema
  .omit({ page: true, pageSize: true })
  .extend({
    formato: z.enum(["csv", "xlsx"]).default("csv"),
  })

export type ExportarLogsModulosQuery = z.infer<typeof exportarLogsModulosQuerySchema>
