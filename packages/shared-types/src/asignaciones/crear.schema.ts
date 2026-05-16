/**
 * Body del alta admin batch: `POST /api/v1/cursos/:cursoId/asignaciones`.
 * D24 (decision conceptual): el admin asigna 1..N colaboradores con
 * `rol=ASIGNADO`. Validaciones de negocio (curso activo, colaboradores activos,
 * unicidad) viven en el service.
 */

import { z } from "zod"

export const crearAsignacionesBatchRequestSchema = z
  .object({
    colaboradorIds: z
      .array(z.string().uuid("Cada colaboradorId debe ser UUID v4"))
      .min(1, "Se requiere al menos un colaboradorId")
      .max(100, "Maximo 100 colaboradores por batch"),
  })
  .strict()

export type CrearAsignacionesBatchRequest = z.infer<typeof crearAsignacionesBatchRequestSchema>
