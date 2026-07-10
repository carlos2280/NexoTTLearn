import { z } from "zod"
import { paginacionQuerySchema } from "../paginacion"

/**
 * Enums replicados del schema Prisma (`TipoBloque`, `EstadoBloque`).
 * Mantener sincronizados con `apps/api/prisma/schema.prisma`.
 */
export const tipoBloqueSchema = z.enum([
  "PARRAFO",
  "TIP",
  "VIDEO",
  "RECURSO",
  "CODIGO_ILUSTRATIVO",
  "QUIZ",
  "CODIGO_PREGUNTAS",
  "CODIGO_TESTS",
  "DIAGRAMA",
  "SQL_EJERCICIO",
  "SQL_TESTS",
  "GIT_EJERCICIO",
])
export type TipoBloque = z.infer<typeof tipoBloqueSchema>

export const estadoBloqueSchema = z.enum(["ACTIVO", "ELIMINADO"])
export type EstadoBloque = z.infer<typeof estadoBloqueSchema>

export const listarBloquesQuerySchema = paginacionQuerySchema.extend({
  seccionId: z.string().uuid().optional(),
  tipo: tipoBloqueSchema.optional(),
  estado: estadoBloqueSchema.optional(),
  // Filtra por `contenido.codigoPreguntasId` (JSONB). Lo usa el editor del Reto
  // para encontrar su bloque CODIGO_TESTS pareado sin traer todo el contenido.
  codigoPreguntasId: z.string().uuid().optional(),
})

export type ListarBloquesQuery = z.infer<typeof listarBloquesQuerySchema>
