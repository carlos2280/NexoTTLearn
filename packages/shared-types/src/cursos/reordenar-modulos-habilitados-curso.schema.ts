import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/modulos-habilitados/orden — reordena los modulos
 * habilitados del curso. El orden es el del array `moduloIds` (indice 0 = primero).
 *
 * Reglas:
 *  - `moduloIds` debe contener EXACTAMENTE los mismos ids que ya estan habilitados
 *    en el curso (no agrega ni quita; eso vive en el otro endpoint).
 *  - No se permiten duplicados.
 *  - El service valida que el set coincide con el actual del curso y emite 422
 *    si difiere.
 *
 * Endpoint separado del de actualizar set (D-CUR-6) porque:
 *  - Reordenar no toca el grafo de skills exigidas → no necesita validar
 *    cobertura ni emitir aviso D82.
 *  - El log de actividad distingue reorden (RUIDO_BAJO) de modificacion
 *    de set (alto impacto).
 */
export const reordenarModulosHabilitadosCursoSchema = z
  .object({
    moduloIds: z
      .array(z.string().uuid())
      .min(1)
      .max(200)
      .refine((ids) => new Set(ids).size === ids.length, "moduloId duplicado en la lista."),
  })
  .strict()

export type ReordenarModulosHabilitadosCursoInput = z.infer<
  typeof reordenarModulosHabilitadosCursoSchema
>
