import type { NivelCualitativoArea, UmbralesLogroValores } from "@nexott-learn/shared-types"
import { UMBRALES_LOGRO_DEFAULT } from "./umbrales-logro.helpers"

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
/**
 * `umbrales` permite que un reporte POR CURSO clasifique con la meta que el
 * admin configuro (`Curso.umbralesLogro`) en vez del canon fijo. En contextos
 * cross-curso (ficha global, historial) se omite y cae al canon del sistema
 * — ahi no existe un umbral de curso unico.
 */
export function nivelDesdeNota(
  nota: number | null,
  umbrales: UmbralesLogroValores = UMBRALES_LOGRO_DEFAULT,
): NivelCualitativoArea {
  if (nota === null) {
    return "sinTocar"
  }
  if (nota >= umbrales.excelencia) {
    return "excelencia"
  }
  if (nota >= umbrales.solido) {
    return "solido"
  }
  if (nota >= umbrales.enDesarrollo) {
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
  umbrales: UmbralesLogroValores = UMBRALES_LOGRO_DEFAULT,
): NivelCualitativoArea {
  if (skillsConNota === 0 || promedio === null) {
    return "sinTocar"
  }
  return nivelDesdeNota(promedio, umbrales)
}
