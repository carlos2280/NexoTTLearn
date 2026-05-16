import { z } from "zod"

/**
 * Acciones admisibles por asignacion al cerrar un curso (D-S11-A2).
 * `MANTENER_PENDIENTE` deja la asignacion en EN_PROGRESO; no transiciona.
 */
export const accionCierreAsignacionSchema = z.enum([
  "CERRAR_APTO",
  "CERRAR_NO_APTO",
  "RETIRAR",
  "MANTENER_PENDIENTE",
])
export type AccionCierreAsignacion = z.infer<typeof accionCierreAsignacionSchema>

/**
 * Body de `POST /api/v1/cursos/:cursoId/cerrar` (D-S11-A2).
 *
 * El array `decisionPorAsignacion` puede venir vacio (el admin cierra un
 * curso sin asignaciones EN_PROGRESO). Validacion dura defense-in-depth en
 * service: toda asignacion EN_PROGRESO debe estar incluida o el endpoint
 * responde 422 `validacionDecisionFaltante`.
 */
export const cerrarCursoSchema = z
  .object({
    decisionPorAsignacion: z
      .array(
        z
          .object({
            asignacionId: z.string().uuid(),
            accion: accionCierreAsignacionSchema,
          })
          .strict(),
      )
      .default([]),
  })
  .strict()

export type CerrarCursoInput = z.infer<typeof cerrarCursoSchema>
