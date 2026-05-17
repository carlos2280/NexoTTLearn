import type { EtiquetaCualitativa, ResultadoCierreCurso } from "@nexott-learn/shared-types"

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
const FRASE_VEREDICTO_APTO: Record<EtiquetaCualitativa, string> = {
  excelencia: "Fue excelente",
  solido: "Fue solido",
  enDesarrollo: "Fue un buen avance",
  noCumple: "Quedo cerrado",
}

// Para NO_APTO la frase es honesta pero no acusatoria. Sin "REPROBADO", sin
// rojo dramatico — el cierre es invitacion a seguir, no juicio.
const FRASE_VEREDICTO_NO_APTO: Record<EtiquetaCualitativa, string> = {
  excelencia: "Aun en camino",
  solido: "Aun en camino",
  enDesarrollo: "Estuvo cerca",
  noCumple: "Falta un poco mas",
}

export function colorDeEtiquetaCualitativa(etiqueta: EtiquetaCualitativa): string {
  return COLOR_POR_ETIQUETA[etiqueta]
}

export function etiquetaCualitativaVisible(etiqueta: EtiquetaCualitativa): string {
  return ETIQUETA_VISIBLE[etiqueta]
}

export function fraseVeredicto(
  resultado: ResultadoCierreCurso,
  etiqueta: EtiquetaCualitativa,
): string {
  if (resultado === "NO_APTO") {
    return FRASE_VEREDICTO_NO_APTO[etiqueta]
  }
  return FRASE_VEREDICTO_APTO[etiqueta]
}
