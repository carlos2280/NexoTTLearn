/**
 * Skill por defecto de un modulo: «‹titulo del curso› · ‹titulo del modulo›».
 * Se usa cuando un bloque evaluable no declara `skill="…"` (al importar) o
 * cuando un curso ya cargado quedo sin skills (al repararlo). Una sola regla
 * para los dos casos: si cambia, cambia en ambos.
 */

// Tope de `skillEtiqueta` en el schema de importacion (importar-curso.schema.ts).
export const MAX_ETIQUETA_SKILL = 200

export function etiquetaSkillPorDefecto(tituloCurso: string, tituloModulo: string): string {
  return `${tituloCurso} · ${tituloModulo}`.slice(0, MAX_ETIQUETA_SKILL)
}
