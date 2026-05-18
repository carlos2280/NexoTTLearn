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
    /**
     * B-extra.2 punto 4: ids de las preguntas que el participante no acerto
     * en este intento. Solo se llena para bloques QUIZ; vacio para los demas
     * tipos. Permite al frontend mostrar la solucion solo en las falladas sin
     * recomputar la correccion del lado cliente.
     */
    preguntasFalladas: z.array(z.string().uuid()).readonly(),
    /**
     * B-extra.2 punto 3: presente solo en la respuesta del POST. `true` cuando
     * este intento aprueba (nota >= `notaMinima` del bloque) y el mejor previo
     * NO aprobaba (o no existia). Permite al frontend evitar el snapshot
     * manual de `mejor.data` antes del POST.
     */
    esPrimeraAprobacion: z.boolean().optional(),
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
