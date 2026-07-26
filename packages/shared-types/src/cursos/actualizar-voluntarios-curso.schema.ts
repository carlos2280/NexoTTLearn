import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/voluntarios — habilita o corta la autoinscripcion
 * de voluntarios (`Curso.toggleVoluntarios`).
 *
 * A diferencia del PATCH general del curso (`actualizarCursoSchema`, que solo
 * admite BORRADOR), este endpoint pertenece a la familia de configuracion P4b:
 * el service lo enruta por `leerCursoParaConfigurar`, que admite BORRADOR y
 * ACTIVO (con `X-Motivo` cuando no es BORRADOR). Apagar el flag NO expulsa a
 * los ya inscritos: solo corta nuevas autoinscripciones y saca el curso del
 * catalogo abierto.
 */
export const actualizarVoluntariosCursoSchema = z
  .object({
    toggleVoluntarios: z.boolean(),
  })
  .strict()

export type ActualizarVoluntariosCursoInput = z.infer<typeof actualizarVoluntariosCursoSchema>
