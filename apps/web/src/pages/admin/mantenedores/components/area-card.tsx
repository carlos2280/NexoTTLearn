import { Badge } from "@/shared/ui/patterns/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import type { Area } from "@nexott-learn/shared-types"
import { Archive, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react"
import { AreaColorDot } from "./area-color-dot"

interface AreaCardProps {
  readonly area: Area
  readonly onEditar: () => void
  readonly onObsoletar: () => void
  readonly onRestaurar: () => void
  readonly onEliminar: () => void
}

export function AreaCard({ area, onEditar, onObsoletar, onRestaurar, onEliminar }: AreaCardProps) {
  const obsoleta = area.estado === "OBSOLETA"

  return (
    <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4 transition-colors hover:border-glass-border-strong">
      <AreaColorDot color={area.color} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-sm text-text-primary">{area.nombre}</h3>
          {obsoleta ? (
            <Badge tone="warning" size="sm">
              Obsoleta
            </Badge>
          ) : null}
        </div>
        {area.descripcion ? (
          <p className="line-clamp-2 text-text-muted text-xs">{area.descripcion}</p>
        ) : null}
        <div className="mt-1 flex items-center gap-3 text-text-muted text-xs">
          <span className="font-mono uppercase tracking-wider">orden {area.orden}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-glass-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
          aria-label={`Acciones de ${area.nombre}`}
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem icon={Pencil} onSelect={onEditar} disabled={obsoleta}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {obsoleta ? (
            <DropdownMenuItem icon={RotateCcw} onSelect={onRestaurar}>
              Restaurar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem icon={Archive} onSelect={onObsoletar}>
              Marcar obsoleta
            </DropdownMenuItem>
          )}
          <DropdownMenuItem icon={Trash2} tone="danger" onSelect={onEliminar}>
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
