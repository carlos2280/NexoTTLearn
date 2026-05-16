import { z } from "zod"
import { ACCIONES_AUDITORIA } from "./auditoria.types"

const accionEnumValues = ACCIONES_AUDITORIA as unknown as readonly [string, ...string[]]

/**
 * Schema base con los filtros comunes del visor de auditoria (D-S12-A2).
 *
 * Todos opcionales y AND. Las fechas se aceptan en formato ISO datetime; el
 * caller del backend convierte a `Date` al consultar Prisma.
 */
const auditoriaFiltrosBaseSchema = z.object({
  actorUsuarioId: z.string().uuid().optional(),
  recursoTipo: z.string().min(1).max(120).optional(),
  recursoId: z.string().uuid().optional(),
  accion: z.enum(accionEnumValues).optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  exito: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined
      }
      return value === true || value === "true"
    }),
})

/**
 * Schema para `GET /admin/auditoria` (listar paginado).
 */
export const listarAuditoriaQuerySchema = auditoriaFiltrosBaseSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type ListarAuditoriaQuery = z.infer<typeof listarAuditoriaQuerySchema>

/**
 * Schema para `GET /admin/auditoria/exportar` (CSV).
 *
 * Identico a la lista pero sin `page` / `pageSize`. El servicio aplica el tope
 * defensivo `count > 50_000` con `code: filtroDemasiadoAmplio` (D-S12-A5).
 */
export const exportarAuditoriaQuerySchema = auditoriaFiltrosBaseSchema

export type ExportarAuditoriaQuery = z.infer<typeof exportarAuditoriaQuerySchema>
