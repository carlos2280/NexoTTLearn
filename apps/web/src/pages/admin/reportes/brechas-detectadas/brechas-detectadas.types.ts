import type { SkillBrechaItem } from "@nexott-learn/shared-types"

/**
 * 3 niveles del gap analysis. Mapping a tokens `--color-state-*` del sistema.
 * Orden = orden visual en la barra apilada (de cumple → no cumple).
 */
export type NivelBrecha = "cumple" | "cerca" | "noCumple"

export interface NivelDefinicion {
  readonly id: NivelBrecha
  readonly etiqueta: string
  readonly tokenColor: string
}

export const NIVELES: readonly NivelDefinicion[] = [
  { id: "cumple", etiqueta: "Cumple", tokenColor: "var(--color-state-apto)" },
  { id: "cerca", etiqueta: "Cerca", tokenColor: "var(--color-state-en-desarrollo)" },
  { id: "noCumple", etiqueta: "No cumple", tokenColor: "var(--color-state-no-apto)" },
]

export function totalSkill(s: SkillBrechaItem): number {
  return s.cumple + s.cerca + s.noCumple
}

/**
 * % de brecha = (cerca + noCumple) / total. Cuanto más alto, más urgente.
 * Se usa para ordenar las skills críticas arriba.
 */
export function porcentajeBrecha(s: SkillBrechaItem): number {
  const total = totalSkill(s)
  if (total === 0) {
    return 0
  }
  return ((s.cerca + s.noCumple) / total) * 100
}
