/**
 * Query de listados de asignaciones — `GET /api/v1/cursos/:cursoId/asignaciones`.
 *
 * `estado` se valida como string libre por dominio: el service distingue
 * estados de ASIGNADO vs VOLUNTARIO segun el rol seleccionado o, si no, los
 * acepta a ambos lados. El admin filtra por estados de su elec cion; el
 * service no fuerza el cruce rol↔estado para no romper bandejas mixtas
 * cuando rol queda sin filtro.
 */

import { z } from "zod"
import { paginacionQuerySchema } from "../catalogo/paginacion"
import { rolAsignacionSchema } from "./asignacion.types"

export const listarAsignacionesQuerySchema = paginacionQuerySchema.extend({
  rol: rolAsignacionSchema.optional(),
  estado: z.string().trim().min(1).max(40).optional(),
  q: z.string().trim().min(2).max(100).optional(),
})

export type ListarAsignacionesQuery = z.infer<typeof listarAsignacionesQuerySchema>
