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

// Frase humanizada para el hero del veredicto: valoración en pasado, calidez
// editorial, sin el sello binario "¡APTO!". El punto final lo pinta el
// componente en el color del estado correspondiente.
const FRASE_VEREDICTO: Record<EtiquetaCualitativa, string> = {
  excelencia: "Fue excelente",
  solido: "Fue solido",
  enDesarrollo: "Fue un buen avance",
  noCumple: "Estuvo cerca",
}

export function colorDeEtiquetaCualitativa(etiqueta: EtiquetaCualitativa): string {
  return COLOR_POR_ETIQUETA[etiqueta]
}

export function etiquetaCualitativaVisible(etiqueta: EtiquetaCualitativa): string {
  return ETIQUETA_VISIBLE[etiqueta]
}

export function fraseVeredicto(etiqueta: EtiquetaCualitativa): string {
  return FRASE_VEREDICTO[etiqueta]
}
