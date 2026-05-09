// Closed palettes for Tiptap rich content. The reader does not use these
// directly (it renders any color present in the JSON), but the admin editor
// in F3 MUST limit the user's choice to these values so the participant
// always sees brand-coherent content.
//
// Hex values are aligned with apps/web/src/styles/tokens.css. If a token
// changes there, sync it here too.

export interface ReaderColorOption {
  readonly name: string
  readonly hex: string
}

export const READER_TEXT_COLORS = [
  { name: "Texto primario", hex: "#f3f0ff" },
  { name: "Texto secundario", hex: "#a8a4b8" },
  { name: "Texto tenue", hex: "#6c6880" },
  { name: "Violeta marca", hex: "#7c3aed" },
  { name: "Cian marca", hex: "#22d3ee" },
  { name: "Esmeralda", hex: "#10b981" },
  { name: "Ambar", hex: "#f59e0b" },
  { name: "Rosa", hex: "#f43f5e" },
] as const satisfies readonly ReaderColorOption[]

export const READER_HIGHLIGHT_COLORS = [
  { name: "Ambar suave", hex: "#fde68a" },
  { name: "Esmeralda suave", hex: "#a7f3d0" },
  { name: "Rosa suave", hex: "#fecdd3" },
  { name: "Cielo suave", hex: "#bae6fd" },
  { name: "Violeta suave", hex: "#ddd6fe" },
  { name: "Pizarra suave", hex: "#e2e8f0" },
] as const satisfies readonly ReaderColorOption[]

export type ReaderTextColor = (typeof READER_TEXT_COLORS)[number]
export type ReaderHighlightColor = (typeof READER_HIGHLIGHT_COLORS)[number]
