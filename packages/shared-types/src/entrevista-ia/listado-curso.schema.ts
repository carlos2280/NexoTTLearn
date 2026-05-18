import { z } from "zod"
import { estadoIntentoEntrevistaIaSchema } from "./types"

/**
 * Listado admin de intentos de Entrevista IA agrupados por curso. Alimenta la
 * tabla del tab "Evaluaciones" dentro de la pantalla admin de cada curso.
 *
 * El shape del item es deliberadamente ligero (sin transcripcion ni reporte
 * cualitativo) — esos datos solo se hidratan al abrir el detalle del intento.
 */

export const listarIntentosEntrevistaIaCursoQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    estado: estadoIntentoEntrevistaIaSchema.optional(),
    busqueda: z.string().trim().min(1).max(100).optional(),
  })
  .strict()

export type ListarIntentosEntrevistaIaCursoQuery = z.infer<
  typeof listarIntentosEntrevistaIaCursoQuerySchema
>

export const intentoEntrevistaIaListadoItemSchema = z
  .object({
    intentoId: z.string().uuid(),
    fecha: z.string(),
    estado: estadoIntentoEntrevistaIaSchema,
    notaGlobal: z.number().min(0).max(100).nullable(),
    notaAjustadaAdmin: z.number().min(0).max(100).nullable(),
    aprobado: z.boolean().nullable(),
    anulado: z.boolean(),
    colaborador: z
      .object({
        id: z.string().uuid(),
        nombre: z.string(),
        email: z.string(),
      })
      .strict(),
  })
  .strict()

export type IntentoEntrevistaIaListadoItem = z.infer<typeof intentoEntrevistaIaListadoItemSchema>
