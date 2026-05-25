import { z } from "zod"
import { paginacionQuerySchema } from "../paginacion"

/**
 * Enum replicado del schema Prisma (`EstadoModulo`). Mantener sincronizado con
 * `apps/api/prisma/schema.prisma`.
 */
export const estadoModuloSchema = z.enum(["ACTIVO", "ARCHIVADO"])
export type EstadoModulo = z.infer<typeof estadoModuloSchema>

export const listarModulosQuerySchema = paginacionQuerySchema.extend({
  estado: estadoModuloSchema.optional(),
  q: z.string().trim().min(2).max(100).optional(),
})

export type ListarModulosQuery = z.infer<typeof listarModulosQuerySchema>
