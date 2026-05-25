import { z } from "zod"
import { paginacionQuerySchema } from "../paginacion"

/**
 * Enum replicado del schema Prisma (`EstadoSkill`). Debe mantenerse sincronizado
 * con `apps/api/prisma/schema.prisma` (la convencion shared-types prohibe importar
 * de `@prisma/client`).
 */
export const estadoSkillSchema = z.enum(["ACTIVA", "ARCHIVADA"])
export type EstadoSkill = z.infer<typeof estadoSkillSchema>

export const listarSkillsQuerySchema = paginacionQuerySchema.extend({
  areaId: z.string().uuid().optional(),
  estado: estadoSkillSchema.optional(),
  q: z.string().trim().min(2).max(100).optional(),
})

export type ListarSkillsQuery = z.infer<typeof listarSkillsQuerySchema>
