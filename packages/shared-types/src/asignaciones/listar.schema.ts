/**
 * Query de listados de asignaciones — `GET /api/v1/cursos/:cursoId/asignaciones`.
 *
 * `estado` se valida como union de los enums de ambos roles: el service
 * lo busca en ambas columnas (CHECK `chk_asig_rol_estado` garantiza que
 * solo una este poblada por fila) sin forzar el cruce rol↔estado, para no
 * romper bandejas mixtas cuando rol queda sin filtro. Cierre §5.80: el
 * tipado en este schema reemplaza los `as` que vivian en el service.
 */

import { z } from "zod"
import { paginacionQuerySchema } from "../catalogo/paginacion"
import {
  estadoAsignadoSchema,
  estadoVoluntarioSchema,
  rolAsignacionSchema,
} from "./asignacion.types"

export const listarAsignacionesQuerySchema = paginacionQuerySchema.extend({
  rol: rolAsignacionSchema.optional(),
  estado: z.union([estadoAsignadoSchema, estadoVoluntarioSchema]).optional(),
  q: z.string().trim().min(2).max(100).optional(),
})

export type ListarAsignacionesQuery = z.infer<typeof listarAsignacionesQuerySchema>
