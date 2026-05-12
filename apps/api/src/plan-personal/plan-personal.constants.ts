/**
 * Constantes compartidas del dominio plan-personal.
 *
 * Centralizadas para evitar duplicacion entre `plan-personal.helpers.ts` y
 * `asignaciones.helpers.ts` (cierre §5.88 — FIX-P7-cierre).
 */

/**
 * Umbral por defecto de aprobacion de un bloque (0-100). Se usa para decidir
 * si una seccion obligatoria se considera completada cuando todos sus bloques
 * evaluables tienen mejor-intento con `nota >= UMBRAL_BLOQUE_DEFAULT`.
 *
 * TODO(post-S7): retirar cuando el schema exponga `Bloque.umbralAprobacion`
 * explicito (D-S7-C2) y cada bloque defina su propio umbral.
 */
export const UMBRAL_BLOQUE_DEFAULT = 70
