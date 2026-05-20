import { z } from "zod"
import { estadoIntentoTransversalSchema } from "./transversal-response.types"

/**
 * Listado admin de intentos transversales agrupados por curso. Alimenta la
 * tabla del tab "Evaluaciones" dentro de la pantalla admin de cada curso.
 *
 * Shape ligero (sin detalleCapas ni evaluacionesCapas) — el detalle se
 * hidrata al abrir el intento. La tabla muestra colaborador + estado + nota
 * global cuando exista.
 */

export const listarIntentosTransversalCursoQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    estado: estadoIntentoTransversalSchema.optional(),
    busqueda: z.string().trim().min(1).max(100).optional(),
  })
  .strict()

export type ListarIntentosTransversalCursoQuery = z.infer<
  typeof listarIntentosTransversalCursoQuerySchema
>

export const intentoTransversalListadoItemSchema = z
  .object({
    intentoId: z.string().uuid(),
    fecha: z.string(),
    estado: estadoIntentoTransversalSchema,
    notaGlobal: z.number().min(0).max(100).nullable(),
    aprobado: z.boolean().nullable(),
    anulado: z.boolean(),
    capasCargadas: z.number().int().min(0).max(3),
    colaborador: z
      .object({
        id: z.string().uuid(),
        nombre: z.string(),
        email: z.string(),
      })
      .strict(),
  })
  .strict()

export type IntentoTransversalListadoItem = z.infer<typeof intentoTransversalListadoItemSchema>
