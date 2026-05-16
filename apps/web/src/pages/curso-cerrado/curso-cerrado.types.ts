import type { EtiquetaCualitativa } from "@nexott-learn/shared-types"

const COLOR_POR_ETIQUETA: Record<EtiquetaCualitativa, string> = {
  excelencia: "var(--color-state-apto)",
  solido: "var(--color-state-solido)",
  enDesarrollo: "var(--color-state-en-desarrollo)",
  noCumple: "var(--color-state-no-apto)",
}

const ETIQUETA_VISIBLE: Record<EtiquetaCualitativa, string> = {
  excelencia: "Excelencia",
  solido: "Solido",
  enDesarrollo: "En desarrollo",
  noCumple: "No cumple",
}

export function colorDeEtiquetaCualitativa(etiqueta: EtiquetaCualitativa): string {
  return COLOR_POR_ETIQUETA[etiqueta]
}

export function etiquetaCualitativaVisible(etiqueta: EtiquetaCualitativa): string {
  return ETIQUETA_VISIBLE[etiqueta]
}
