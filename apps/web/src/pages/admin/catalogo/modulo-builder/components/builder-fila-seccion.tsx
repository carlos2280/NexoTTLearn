import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { cn } from "@/shared/lib/cn"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { BloqueResponse, SeccionResponse } from "@nexott-learn/shared-types"
import { ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react"
import type { CSSProperties } from "react"
import { PREFIX_BLQ, PREFIX_SEC } from "../arbol-permutacion"
import { bloquesVisibles } from "../reordenar-bloques"
import type { SeccionConBloques, Seleccion } from "../types"
import { FilaBloque } from "./builder-fila-bloque"

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

export function FilaSeccion(props: FilaSeccionProps) {
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
  const visibles = bloquesVisibles(item.bloques)

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
          items={visibles.map((b) => `${PREFIX_BLQ}${b.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="ml-5 flex flex-col gap-0.5 border-border border-l py-1 pl-1.5">
            {visibles.map((bloque) => (
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
