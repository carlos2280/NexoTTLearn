import type { InventarioSkillsConteoCualitativo } from "@nexott-learn/shared-types"

export type NivelCualitativo = keyof InventarioSkillsConteoCualitativo

export interface NivelDefinicion {
  readonly id: NivelCualitativo
  readonly etiqueta: string
  readonly tokenColor: string
  readonly tokenSoft: string
  readonly tokenOnSoft: string
}

/**
 * Mapeo del modelo de inventario (4 etiquetas cualitativas) a los tokens
 * `--color-state-*` del sistema de identidad visual. Mantener este orden
 * = orden visual en la barra apilada (de más fuerte a menos fuerte).
 */
export const NIVELES: readonly NivelDefinicion[] = [
  {
    id: "excelencia",
    etiqueta: "Excelencia",
    tokenColor: "var(--color-state-apto)",
    tokenSoft: "var(--color-state-apto-soft)",
    tokenOnSoft: "var(--color-state-apto-on-soft)",
  },
  {
    id: "solido",
    etiqueta: "Sólido",
    tokenColor: "var(--color-state-solido)",
    tokenSoft: "var(--color-state-solido-soft)",
    tokenOnSoft: "var(--color-state-solido-on-soft)",
  },
  {
    id: "enDesarrollo",
    etiqueta: "En desarrollo",
    tokenColor: "var(--color-state-en-desarrollo)",
    tokenSoft: "var(--color-state-en-desarrollo-soft)",
    tokenOnSoft: "var(--color-state-en-desarrollo-on-soft)",
  },
  {
    id: "noCumple",
    etiqueta: "No cumple",
    tokenColor: "var(--color-state-no-apto)",
    tokenSoft: "var(--color-state-no-apto-soft)",
    tokenOnSoft: "var(--color-state-no-apto-on-soft)",
  },
] as const
