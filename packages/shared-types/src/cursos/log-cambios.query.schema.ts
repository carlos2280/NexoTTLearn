import { z } from "zod"
import { paginacionQuerySchema } from "../catalogo/paginacion"
import { accionLogCursoSchema } from "./curso.types"

/**
 * Query de `GET /api/v1/cursos/:id/log-cambios`. Las fechas `desde`/`hasta`
 * se interpretan como timestamps ISO inclusivos.
 */
export const listarLogCambiosQuerySchema = paginacionQuerySchema.extend({
  accion: accionLogCursoSchema.optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
})

export type ListarLogCambiosQuery = z.infer<typeof listarLogCambiosQuerySchema>
