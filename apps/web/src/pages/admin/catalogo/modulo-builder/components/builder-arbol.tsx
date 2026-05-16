import { Button } from "@/shared/components/ui/button"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { cn } from "@/shared/lib/cn"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { BloqueResponse, SeccionResponse } from "@nexott-learn/shared-types"
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { type CSSProperties, useEffect, useState } from "react"
import { tipoBloqueMeta } from "../bloque-tipo-meta"
import type { SeccionConBloques, Seleccion } from "../types"

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
  readonly onReordenarSecciones: (
    orden: ReadonlyArray<{ readonly seccionId: string; readonly orden: number }>,
  ) => Promise<void>
  readonly onReordenarBloques: (
    seccionId: string,
    orden: ReadonlyArray<{ readonly bloqueId: string; readonly orden: number }>,
  ) => Promise<void>
}

// Prefijos de id para distinguir tipo de item en drag events.
const PREFIX_SEC = "sec:"
const PREFIX_BLQ = "blq:"

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

  useEffect(() => {
    setExpandidas((prev) => {
      const siguiente = new Set(prev)
      for (const item of arbol) {
        siguiente.add(item.seccion.id)
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lógica de drag-and-drop con ramas para sección y bloque — no reducible sin perder claridad
  async function manejarDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const activeId = String(active.id)
    const overId = String(over.id)

    // Reordenar secciones
    if (activeId.startsWith(PREFIX_SEC) && overId.startsWith(PREFIX_SEC)) {
      const ids = arbol.map((item) => item.seccion.id)
      const from = ids.indexOf(activeId.slice(PREFIX_SEC.length))
      const to = ids.indexOf(overId.slice(PREFIX_SEC.length))
      if (from < 0 || to < 0 || from === to) {
        return
      }
      const siguiente = [...ids]
      const [extraido] = siguiente.splice(from, 1)
      if (!extraido) {
        return
      }
      siguiente.splice(to, 0, extraido)
      const permutacion = siguiente.map((seccionId, idx) => ({
        seccionId,
        orden: idx + 1,
      }))
      await onReordenarSecciones(permutacion)
      return
    }

    // Reordenar bloques (solo dentro de la misma sección)
    if (activeId.startsWith(PREFIX_BLQ) && overId.startsWith(PREFIX_BLQ)) {
      const aBId = activeId.slice(PREFIX_BLQ.length)
      const oBId = overId.slice(PREFIX_BLQ.length)
      const seccionDelActive = arbol.find((it) => it.bloques.some((b) => b.id === aBId))
      const seccionDelOver = arbol.find((it) => it.bloques.some((b) => b.id === oBId))
      if (!seccionDelActive || seccionDelActive !== seccionDelOver) {
        // No permitimos cross-section por ahora.
        return
      }
      const ids = seccionDelActive.bloques.map((b) => b.id)
      const from = ids.indexOf(aBId)
      const to = ids.indexOf(oBId)
      if (from < 0 || to < 0 || from === to) {
        return
      }
      const siguiente = [...ids]
      const [extraido] = siguiente.splice(from, 1)
      if (!extraido) {
        return
      }
      siguiente.splice(to, 0, extraido)
      const permutacion = siguiente.map((bloqueId, idx) => ({
        bloqueId,
        orden: idx + 1,
      }))
      await onReordenarBloques(seccionDelActive.seccion.id, permutacion)
    }
  }

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={manejarDragEnd}
          >
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

interface FilaSeccionProps {
  readonly item: SeccionConBloques
  readonly abierta: boolean
  readonly seleccion: Seleccion
  readonly onAlternar: () => void
  readonly onSeleccionarSeccion: (seccionId: string) => void
  readonly onSeleccionarBloque: (bloqueId: string) => void
  readonly onRenombrarSeccion: (seccion: SeccionResponse) => void
  readonly onEliminarSeccion: (seccion: SeccionResponse) => void
  readonly onCrearBloque: (seccionId: string) => void
  readonly onEliminarBloque: (bloque: BloqueResponse) => void
}

function FilaSeccion(props: FilaSeccionProps) {
  const {
    item,
    abierta,
    seleccion,
    onAlternar,
    onSeleccionarSeccion,
    onSeleccionarBloque,
    onRenombrarSeccion,
    onEliminarSeccion,
    onCrearBloque,
    onEliminarBloque,
  } = props
  const sortable = useSortable({ id: `${PREFIX_SEC}${item.seccion.id}` })
  const seccionActiva = seleccion.tipo === "seccion" && seleccion.seccionId === item.seccion.id

  const style: CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.6 : 1,
  }

  return (
    <li ref={sortable.setNodeRef} style={style} className="flex flex-col">
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 pr-1 pl-0.5 text-body-sm",
          "transition-[background-color,color,box-shadow] duration-fast ease-default",
          seccionActiva
            ? "bg-subtle font-medium text-text-primary shadow-xs"
            : "text-text-primary hover:bg-subtle/60",
        )}
      >
        <button
          type="button"
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label="Arrastrar sección"
          className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-text-tertiary opacity-0 transition-opacity duration-fast ease-default hover:text-text-secondary active:cursor-grabbing group-hover:opacity-100"
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
        </button>
        <button
          type="button"
          onClick={onAlternar}
          aria-label={abierta ? "Colapsar sección" : "Expandir sección"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-muted hover:text-text-secondary"
        >
          {abierta ? (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSeleccionarSeccion(item.seccion.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="tabular shrink-0 text-caption text-text-tertiary">
            {item.seccion.orden}.
          </span>
          <span className="truncate font-medium">{item.seccion.titulo}</span>
        </button>
        <MenuAcciones
          etiquetaAria={`Acciones de ${item.seccion.titulo}`}
          grupos={[
            [
              {
                id: "renombrar",
                etiqueta: "Renombrar",
                icono: Pencil,
                onClick: () => onRenombrarSeccion(item.seccion),
              },
            ],
            [
              {
                id: "eliminar",
                etiqueta: "Eliminar sección",
                icono: Trash2,
                destructiva: true,
                onClick: () => onEliminarSeccion(item.seccion),
              },
            ],
          ]}
        />
      </div>

      {abierta ? (
        <SortableContext
          items={item.bloques.map((b) => `${PREFIX_BLQ}${b.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="ml-5 flex flex-col gap-0.5 border-border border-l py-1 pl-1.5">
            {item.bloques.map((bloque) => (
              <FilaBloque
                key={bloque.id}
                bloque={bloque}
                activo={seleccion.tipo === "bloque" && seleccion.bloqueId === bloque.id}
                onSeleccionar={() => onSeleccionarBloque(bloque.id)}
                onEliminar={() => onEliminarBloque(bloque)}
              />
            ))}
            <button
              type="button"
              onClick={() => onCrearBloque(item.seccion.id)}
              className="mt-0.5 flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-body-sm text-text-secondary transition-[background-color,color] duration-fast ease-default hover:bg-subtle hover:text-accent [&_svg]:text-text-tertiary [&_svg]:transition-colors [&_svg]:duration-fast hover:[&_svg]:text-accent"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
              Añadir bloque
            </button>
          </div>
        </SortableContext>
      ) : null}
    </li>
  )
}

interface FilaBloqueProps {
  readonly bloque: BloqueResponse
  readonly activo: boolean
  readonly onSeleccionar: () => void
  readonly onEliminar: () => void
}

function FilaBloque({ bloque, activo, onSeleccionar, onEliminar }: FilaBloqueProps) {
  const sortable = useSortable({ id: `${PREFIX_BLQ}${bloque.id}` })
  const meta = tipoBloqueMeta(bloque.tipo)
  const Icono = meta.icono

  const style: CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.6 : 1,
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md px-0.5 py-1",
        "transition-[background-color,color,box-shadow] duration-fast ease-default",
        activo ? "bg-subtle text-text-primary shadow-xs" : "text-text-secondary hover:bg-subtle/60",
      )}
    >
      <button
        type="button"
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label="Arrastrar bloque"
        // biome-ignore lint/nursery/useSortedClasses: orden intencional — cursor-grab primero para legibilidad del grupo de interacción
        className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-text-tertiary opacity-0 transition-opacity duration-fast ease-default hover:text-text-secondary group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
      </button>
      <button
        type="button"
        onClick={onSeleccionar}
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-caption"
      >
        <Icono
          className={cn("h-3.5 w-3.5 shrink-0", activo ? "text-accent" : "text-text-tertiary")}
          strokeWidth={1.5}
          aria-hidden={true}
        />
        <span className="truncate">{meta.etiqueta}</span>
        {bloque.version > 1 ? (
          <span className="tabular ml-auto shrink-0 font-mono text-text-tertiary">
            v{bloque.version}
          </span>
        ) : null}
      </button>
      <MenuAcciones
        etiquetaAria={`Acciones de bloque ${meta.etiqueta}`}
        grupos={[
          [
            {
              id: "eliminar",
              etiqueta: "Eliminar bloque",
              icono: Trash2,
              destructiva: true,
              onClick: onEliminar,
            },
          ],
        ]}
      />
    </div>
  )
}
