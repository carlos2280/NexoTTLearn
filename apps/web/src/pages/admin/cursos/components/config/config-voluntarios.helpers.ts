import type { ActualizarCursoInput } from "@nexott-learn/shared-types"

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
 * Construye el input del PATCH del curso para el toggle de voluntarios.
 *
 * Solo viaja `toggleVoluntarios` (edicion atomica): el resto de campos del
 * curso queda intacto. Fijar este contrato evita que un cambio futuro mande
 * el curso entero por accidente.
 */
export function construirInputVoluntarios(permite: boolean): ActualizarCursoInput {
  return { toggleVoluntarios: permite }
}
