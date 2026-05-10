import { create } from "zustand"

// El editor mantiene un único estado local: qué nodo está seleccionado.
// El resto vive en TanStack Query (data del back) o en componentes (forms,
// hovers, etc.). Mantener este store flaco evita reinventar la rueda y
// hace que el "guardado" sea naturalmente la mutación que toca.

export type SelectedNode =
  | { readonly tipo: "curso" }
  | { readonly tipo: "area"; readonly cursoAreaId: string }
  | { readonly tipo: "modulo"; readonly moduloId: string }
  | { readonly tipo: "seccion"; readonly moduloId: string; readonly seccionId: string }
  | {
      readonly tipo: "bloque"
      readonly moduloId: string
      readonly seccionId: string
      readonly bloqueId: string
    }
  | { readonly tipo: "transversal" }
  | { readonly tipo: "entrevista" }

interface EditorState {
  readonly selected: SelectedNode
  readonly isPaletteOpen: boolean
  readonly isPublishOpen: boolean
  readonly isChecklistOpen: boolean
  readonly setSelected: (node: SelectedNode) => void
  readonly openPalette: () => void
  readonly closePalette: () => void
  readonly openPublish: () => void
  readonly closePublish: () => void
  readonly openChecklist: () => void
  readonly closeChecklist: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selected: { tipo: "curso" },
  isPaletteOpen: false,
  isPublishOpen: false,
  isChecklistOpen: false,
  setSelected: (selected) => set({ selected }),
  openPalette: () => set({ isPaletteOpen: true }),
  closePalette: () => set({ isPaletteOpen: false }),
  openPublish: () => set({ isPublishOpen: true }),
  closePublish: () => set({ isPublishOpen: false }),
  openChecklist: () => set({ isChecklistOpen: true }),
  closeChecklist: () => set({ isChecklistOpen: false }),
}))
