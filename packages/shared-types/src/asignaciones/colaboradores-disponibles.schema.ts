/**
 * Listado de colaboradores disponibles para asignar a un curso concreto:
 *   `GET /api/v1/cursos/:cursoId/colaboradores-disponibles`.
 *
 * Devuelve solo colaboradores ACTIVOS que aun no estan inscritos en ese curso
 * (ni como ASIGNADO ni como VOLUNTARIO). Pensado para alimentar el selector
 * visual del dialogo "Asignar colaboradores" del admin.
 */

import { z } from "zod"

export const listarColaboradoresDisponiblesQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

export type ListarColaboradoresDisponiblesQuery = z.infer<
  typeof listarColaboradoresDisponiblesQuerySchema
>

export interface ColaboradorDisponible {
  readonly id: string
  readonly nombre: string
  readonly email: string
}
