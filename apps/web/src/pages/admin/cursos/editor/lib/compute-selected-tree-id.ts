import type { useEditorStore } from "../use-editor-store"
import { TREE_IDS } from "./build-tree"

type Selected = ReturnType<typeof useEditorStore.getState>["selected"]

export function computeSelectedTreeId(selected: Selected): string | null {
  switch (selected.tipo) {
    case "curso":
      return TREE_IDS.curso
    case "area":
      return TREE_IDS.area(selected.cursoAreaId)
    case "modulo":
      return TREE_IDS.modulo(selected.moduloId)
    case "seccion":
    case "bloque":
      return TREE_IDS.seccion(selected.moduloId, selected.seccionId)
    case "transversal":
      return TREE_IDS.transversal
    case "entrevista":
      return TREE_IDS.entrevista
    default: {
      const _exhaustive: never = selected
      return _exhaustive
    }
  }
}
