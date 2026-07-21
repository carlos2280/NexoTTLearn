import { Button } from "@/shared/components/ui/button"
import { DndContext, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { BloqueResponse, SeccionResponse } from "@nexott-learn/shared-types"
import { Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { type OrdenBloques, type OrdenSecciones, PREFIX_SEC } from "../arbol-permutacion"
import { useArbolDnd } from "../hooks/use-arbol-dnd"
import type { SeccionConBloques, Seleccion } from "../types"
import { FilaSeccion } from "./builder-fila-seccion"

interface BuilderArbolProps {
  readonly arbol: readonly SeccionConBloques[]
  readonly seleccion: Seleccion
  readonly onSeleccionarSeccion: (seccionId: string) => void
  readonly onSeleccionarBloque: (bloqueId: string) => void
  readonly onCrearSeccion: () => void
  readonly onRenombrarSeccion: (seccion: SeccionResponse) => void
  readonly onEliminarSeccion: (seccion: SeccionResponse) => void
  readonly onCrearBloque: (seccionId: string) => void
  readonly onEliminarBloque: (bloque: BloqueResponse) => void
  readonly onReordenarSecciones: (orden: OrdenSecciones) => Promise<void>
  readonly onReordenarBloques: (seccionId: string, orden: OrdenBloques) => Promise<void>
}

/**
 * Ids de secciones que aún no se habían visto — se auto-expanden una sola vez.
 * Las ya conocidas (incluidas las que el usuario colapsó a propósito) NO se
 * re-expanden aunque `arbol` cambie de referencia por un refetch de la query.
 */
export function idsSeccionesNuevas(
  idsActuales: readonly string[],
  conocidas: ReadonlySet<string>,
): readonly string[] {
  return idsActuales.filter((id) => !conocidas.has(id))
}

export function BuilderArbol({
  arbol,
  seleccion,
  onSeleccionarSeccion,
  onSeleccionarBloque,
  onCrearSeccion,
  onRenombrarSeccion,
  onEliminarSeccion,
  onCrearBloque,
  onEliminarBloque,
  onReordenarSecciones,
  onReordenarBloques,
}: BuilderArbolProps) {
  const [expandidas, setExpandidas] = useState<ReadonlySet<string>>(
    () => new Set(arbol.map((item) => item.seccion.id)),
  )
  // Secciones a las que ya se les aplicó el estado inicial (expandido por
  // defecto). Es un ref, no estado: solo sirve para no re-expandir una sección
  // colapsada cuando `arbol` cambia de referencia (refetch en cada navegación).
  const seccionesConocidas = useRef<Set<string>>(new Set(arbol.map((item) => item.seccion.id)))

  useEffect(() => {
    const nuevas = idsSeccionesNuevas(
      arbol.map((item) => item.seccion.id),
      seccionesConocidas.current,
    )
    if (nuevas.length === 0) {
      return
    }
    for (const id of nuevas) {
      seccionesConocidas.current.add(id)
    }
    setExpandidas((prev) => {
      const siguiente = new Set(prev)
      for (const id of nuevas) {
        siguiente.add(id)
      }
      return siguiente
    })
  }, [arbol])

  function alternarSeccion(seccionId: string) {
    setExpandidas((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(seccionId)) {
        siguiente.delete(seccionId)
      } else {
        siguiente.add(seccionId)
      }
      return siguiente
    })
  }

  const { sensors, onDragEnd } = useArbolDnd({ arbol, onReordenarSecciones, onReordenarBloques })

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-border border-r bg-surface">
      <div className="flex items-center justify-between gap-2 border-border border-b px-3 py-2.5">
        <span className="nx-eyebrow text-text-tertiary">Estructura</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCrearSeccion}
          aria-label="Crear sección"
          title="Crear sección"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2" aria-label="Árbol del módulo">
        {arbol.length === 0 ? (
          <div className="flex flex-col gap-3 px-2 py-6">
            <p className="text-body-sm text-text-secondary">
              Aún no hay secciones. Empieza creando la primera.
            </p>
            <Button variant="secondary" size="sm" onClick={onCrearSeccion}>
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
              Nueva sección
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={arbol.map((it) => `${PREFIX_SEC}${it.seccion.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <ol className="flex flex-col gap-0.5">
                {arbol.map((item) => (
                  <FilaSeccion
                    key={item.seccion.id}
                    item={item}
                    abierta={expandidas.has(item.seccion.id)}
                    seleccion={seleccion}
                    onAlternar={() => alternarSeccion(item.seccion.id)}
                    onSeleccionarSeccion={onSeleccionarSeccion}
                    onSeleccionarBloque={onSeleccionarBloque}
                    onRenombrarSeccion={onRenombrarSeccion}
                    onEliminarSeccion={onEliminarSeccion}
                    onCrearBloque={onCrearBloque}
                    onEliminarBloque={onEliminarBloque}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </nav>
    </aside>
  )
}
