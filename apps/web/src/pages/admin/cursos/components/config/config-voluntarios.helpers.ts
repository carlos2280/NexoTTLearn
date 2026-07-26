import type { ActualizarVoluntariosCursoInput } from "@nexott-learn/shared-types"

/**
 * Copy del estado del toggle de voluntarios. Se muestra bajo el switch para
 * que el admin entienda el efecto sin abrir la ayuda.
 */
export function descripcionVoluntarios(permite: boolean): string {
  return permite
    ? "Cualquier colaborador puede inscribirse al curso por su cuenta."
    : "Solo los asignados explícitamente pueden cursarlo."
}

/**
 * Construye el input del PATCH de configuracion de voluntarios.
 *
 * Usa el contrato dedicado `ActualizarVoluntariosCursoInput` (endpoint
 * `/cursos/:id/voluntarios`, que admite BORRADOR y ACTIVO), no el PATCH general
 * del curso (solo BORRADOR). Solo viaja `toggleVoluntarios`: el schema `.strict()`
 * impide arrastrar cualquier otro campo del curso por accidente.
 */
export function construirInputVoluntarios(permite: boolean): ActualizarVoluntariosCursoInput {
  return { toggleVoluntarios: permite }
}
