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

/**
 * Tipos de bloque que reciben intentos con nota: los unicos que pueden ser
 * evaluables (`esEvaluable=true`) y contar como pregunta en el avance. Un
 * PARRAFO o un RECURSO marcado evaluable no se puede responder nunca y deja
 * su seccion sin completarse. Fuente unica para API y web.
 */
export const TIPOS_BLOQUE_EVALUABLES = [
  "QUIZ",
  "CODIGO_PREGUNTAS",
  "SQL_EJERCICIO",
] as const satisfies readonly TipoBloque[]

export function esTipoBloqueEvaluable(tipo: string): boolean {
  return (TIPOS_BLOQUE_EVALUABLES as readonly string[]).includes(tipo)
}

export const estadoBloqueSchema = z.enum(["ACTIVO", "ELIMINADO"])
export type EstadoBloque = z.infer<typeof estadoBloqueSchema>

export const listarBloquesQuerySchema = paginacionQuerySchema.extend({
  seccionId: z.string().uuid().optional(),
  tipo: tipoBloqueSchema.optional(),
  estado: estadoBloqueSchema.optional(),
  // Filtra por `contenido.codigoPreguntasId` (JSONB). Lo usa el editor del Reto
  // para encontrar su bloque CODIGO_TESTS pareado sin traer todo el contenido.
  codigoPreguntasId: z.string().uuid().optional(),
  // Espejo del anterior para SQL: filtra por `contenido.sqlEjercicioId` (JSONB).
  // Lo usa el editor del Reto SQL para hallar su bloque SQL_TESTS pareado.
  sqlEjercicioId: z.string().uuid().optional(),
})

export type ListarBloquesQuery = z.infer<typeof listarBloquesQuerySchema>
