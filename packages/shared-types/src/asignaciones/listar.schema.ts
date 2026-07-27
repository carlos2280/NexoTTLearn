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
import { booleanQuerySchema, paginacionQuerySchema } from "../catalogo/paginacion"
import {
  estadoAsignadoSchema,
  estadoVoluntarioSchema,
  rolAsignacionSchema,
} from "./asignacion.types"

export const listarAsignacionesQuerySchema = paginacionQuerySchema.extend({
  rol: rolAsignacionSchema.optional(),
  estado: z.union([estadoAsignadoSchema, estadoVoluntarioSchema]).optional(),
  q: z.string().trim().min(2).max(100).optional(),
  /**
   * Los RETIRADO se ocultan por defecto: son terminales (no hay accion de
   * reactivar) y no ofrecen ninguna accion en la tabla, asi que solo empujan a
   * la gente activa a la pagina siguiente. En el curso minero real son 10 de
   * 26 filas. Se siguen pudiendo ver pidiendolos explicitamente — con este
   * flag, o filtrando por `estado=RETIRADO`, que manda sobre el flag.
   */
  incluirRetirados: booleanQuerySchema(),
})

export type ListarAsignacionesQuery = z.infer<typeof listarAsignacionesQuerySchema>
