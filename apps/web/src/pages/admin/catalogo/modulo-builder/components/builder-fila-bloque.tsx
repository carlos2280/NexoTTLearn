import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { cn } from "@/shared/lib/cn"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { BloqueResponse } from "@nexott-learn/shared-types"
import { GripVertical, Trash2 } from "lucide-react"
import type { CSSProperties } from "react"
import { PREFIX_BLQ } from "../arbol-permutacion"
import { tipoBloqueMeta } from "../bloque-tipo-meta"

interface FilaBloqueProps {
  readonly bloque: BloqueResponse
  readonly activo: boolean
  readonly onSeleccionar: () => void
  readonly onEliminar: () => void
}

export function FilaBloque({ bloque, activo, onSeleccionar, onEliminar }: FilaBloqueProps) {
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
