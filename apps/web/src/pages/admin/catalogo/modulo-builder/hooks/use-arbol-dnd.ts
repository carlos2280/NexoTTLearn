import { type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  type OrdenBloques,
  type OrdenSecciones,
  permutarBloques,
  permutarSecciones,
} from "../arbol-permutacion"
import type { SeccionConBloques } from "../types"

interface UseArbolDndParams {
  readonly arbol: readonly SeccionConBloques[]
  readonly onReordenarSecciones: (orden: OrdenSecciones) => Promise<void>
  readonly onReordenarBloques: (seccionId: string, orden: OrdenBloques) => Promise<void>
}

/**
 * Sensores + handler de drag-and-drop del arbol del builder. Delega el calculo
 * de la nueva permutacion a las funciones puras de `arbol-permutacion` y solo
 * decide a que callback persistente derivar (secciones o bloques).
 */
export function useArbolDnd({
  arbol,
  onReordenarSecciones,
  onReordenarBloques,
}: UseArbolDndParams) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const activeId = String(active.id)
    const overId = String(over.id)

    const ordenSecciones = permutarSecciones(arbol, activeId, overId)
    if (ordenSecciones) {
      await onReordenarSecciones(ordenSecciones)
      return
    }

    const reordenBloques = permutarBloques(arbol, activeId, overId)
    if (reordenBloques) {
      await onReordenarBloques(reordenBloques.seccionId, reordenBloques.permutacion)
    }
  }

  return { sensors, onDragEnd }
}
