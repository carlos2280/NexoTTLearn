import { z } from "zod"
import { paginacionQuerySchema } from "../catalogo/paginacion"
import { estadoCursoSchema } from "./curso.types"

const fechaDiaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Debe ser fecha en formato YYYY-MM-DD")

/**
 * Query de `GET /api/v1/cursos`. Defaults:
 *   - `incluirArchivados=false` (D-CUR-13: ADMIN debe pedirlos explicitamente).
 *   - `page=1`, `pageSize=20`.
 *
 * Para PARTICIPANTE el service ignora `incluirArchivados` y `clienteId` y
 * fuerza el scope D-CUR-13.
 */
export const listarCursosQuerySchema = paginacionQuerySchema.extend({
  estado: estadoCursoSchema.optional(),
  clienteId: z.string().uuid().optional(),
  q: z.string().trim().min(2).max(100).optional(),
  incluirArchivados: z.coerce.boolean().default(false),
  fechaDeadlineDesde: fechaDiaSchema.optional(),
  fechaDeadlineHasta: fechaDiaSchema.optional(),
  sort: z.enum(["createdAt", "fechaDeadline", "titulo"]).default("createdAt"),
})

export type ListarCursosQuery = z.infer<typeof listarCursosQuerySchema>
