import { z } from "zod"
import { booleanQuerySchema } from "../catalogo/paginacion"

/**
 * Shapes de respuesta del dominio intentos-bloque (Slice 7 P7b).
 *
 * Mantenemos schemas Zod ligeros para que el frontend pueda parsear con la
 * misma fuente de verdad. Los tipos derivados se exportan via `z.infer`.
 */
export const intentoBloqueResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    bloqueId: z.string().uuid(),
    skillId: z.string().uuid(),
    cursoId: z.string().uuid(),
    nota: z.number().min(0).max(100),
    esMejorIntento: z.boolean(),
    versionBloque: z.number().int().min(1),
    estaInvalidado: z.boolean(),
    fecha: z.string(),
  })
  .strict()

export type IntentoBloqueResponse = z.infer<typeof intentoBloqueResponseSchema>

export const listarIntentosBloqueQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    incluirInvalidados: booleanQuerySchema(),
  })
  .strict()

export type ListarIntentosBloqueQuery = z.infer<typeof listarIntentosBloqueQuerySchema>

export const listarIntentosCursoBloqueQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    colaboradorId: z.string().uuid().optional(),
    incluirInvalidados: booleanQuerySchema(),
  })
  .strict()

export type ListarIntentosCursoBloqueQuery = z.infer<typeof listarIntentosCursoBloqueQuerySchema>
