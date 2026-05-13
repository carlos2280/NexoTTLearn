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

/**
 * Schema para `GET /admin/logs/cursos/exportar` (P-B-c).
 *
 * Hereda los filtros del visor pagindo pero omite `page`/`pageSize` (los
 * exports no paginan; aplican el tope `LIMITE_FILAS_EXPORTACION = 50_000` del
 * helper auditoria). Anade `formato` con default CSV (alineado con el patron
 * `me/ficha/exportar?formato=csv|pdf` del autoservicio).
 */
export const exportarLogsCursosQuerySchema = listarLogsCursosQuerySchema
  .omit({ page: true, pageSize: true })
  .extend({
    formato: z.enum(["csv", "xlsx"]).default("csv"),
  })

export type ExportarLogsCursosQuery = z.infer<typeof exportarLogsCursosQuerySchema>
