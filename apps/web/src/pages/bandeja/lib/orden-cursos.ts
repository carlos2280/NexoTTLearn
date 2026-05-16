import { formatearDeadline } from "@/features/me/lib/deadline-curso"
import type { MeCursoResumenConSkills } from "../types"

/**
 * Ordena los cursos activos del participante para la bandeja según la regla
 * de el_viaje_colaborador.md (pantalla 01, bloque 2):
 *
 *   1. Cursos con deadline `vencido`
 *   2. Cursos con deadline `cercano`
 *   3. Cursos con deadline `lejos`
 *
 *   Dentro de cada grupo, por `porcentajeAvance` ascendente (los más atrás
 *   primero — son los que necesitan atención).
 *
 * Función pura sin React. Recibe la lista cruda y devuelve una nueva ordenada.
 */
const PESO_TONO: Record<"vencido" | "cercano" | "lejos", number> = {
  vencido: 0,
  cercano: 1,
  lejos: 2,
}

export function ordenarCursosActivos(
  cursos: readonly MeCursoResumenConSkills[],
): readonly MeCursoResumenConSkills[] {
  return [...cursos].sort((a, b) => {
    const tonoA = formatearDeadline(a.fechaDeadline).tono
    const tonoB = formatearDeadline(b.fechaDeadline).tono
    if (tonoA !== tonoB) {
      return PESO_TONO[tonoA] - PESO_TONO[tonoB]
    }
    return a.porcentajeAvance - b.porcentajeAvance
  })
}
