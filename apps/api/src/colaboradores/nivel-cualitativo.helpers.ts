import type { NivelCualitativoArea } from "@nexott-learn/shared-types"

/**
 * Umbrales canonicos de la escala de 5 niveles cualitativos usada por la ficha
 * (`/me/ficha`, `/colaboradores/:id/ficha`), el historial (`/me/ficha/historial`)
 * y el camino hacia apto por curso (`/me/avance/cursos/:id`). Alineados con
 * `inventario-skills` (D-S11-C3) y la pantalla "Mi ficha".
 *
 *   nota >= 85 -> excelencia
 *   nota >= 70 -> solido
 *   nota >= 50 -> enDesarrollo
 *   nota <  50 -> inicial
 *   nota null  -> sinTocar
 *
 * `MeFichaResumenService` (B-3, widget "Tu camino" de la bandeja) usa una escala
 * mas compacta de 3 niveles propia, por contrato con la UI; no se reutiliza
 * aqui.
 */
const UMBRAL_EXCELENCIA = 85
const UMBRAL_SOLIDO = 70
const UMBRAL_DESARROLLO = 50

export function nivelDesdeNota(nota: number | null): NivelCualitativoArea {
  if (nota === null) {
    return "sinTocar"
  }
  if (nota >= UMBRAL_EXCELENCIA) {
    return "excelencia"
  }
  if (nota >= UMBRAL_SOLIDO) {
    return "solido"
  }
  if (nota >= UMBRAL_DESARROLLO) {
    return "enDesarrollo"
  }
  return "inicial"
}

/**
 * Nivel cualitativo agregado de un area de la ficha. Si el colaborador no tiene
 * ninguna skill demostrada en el area, devuelve `sinTocar` (no `inicial`, que
 * implicaria evidencia mediocre). En caso contrario clasifica por el promedio
 * de las skills con nota.
 */
export function nivelCualitativoAreaDesdePromedio(
  promedio: number | null,
  skillsConNota: number,
): NivelCualitativoArea {
  if (skillsConNota === 0 || promedio === null) {
    return "sinTocar"
  }
  return nivelDesdeNota(promedio)
}
