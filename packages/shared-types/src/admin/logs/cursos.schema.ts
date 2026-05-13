import { z } from "zod"
import { ACCIONES_LOG_CURSO } from "./cursos.types"

const accionEnumValues = ACCIONES_LOG_CURSO as unknown as readonly [string, ...string[]]

/**
 * Schema para `GET /admin/logs/cursos`.
 *
 * Filtros opcionales en AND. Las fechas se aceptan en ISO datetime con offset
 * (mismo contrato que el visor de auditoria). El backend convierte a `Date` al
 * consultar Prisma (`gte`/`lt`).
 *
 * Paginacion con cap duro `pageSize <= 200` para proteger memoria y red.
 */
export const listarLogsCursosQuerySchema = z.object({
  cursoId: z.string().uuid().optional(),
  accion: z.enum(accionEnumValues).optional(),
  autorUsuarioId: z.string().uuid().optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarLogsCursosQuery = z.infer<typeof listarLogsCursosQuerySchema>
